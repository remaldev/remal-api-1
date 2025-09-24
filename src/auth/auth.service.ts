import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { TokenType } from '@prisma/client'
import * as bcrypt from 'bcrypt'
import { randomInt } from 'node:crypto'
import { MailerService } from '../mailer/mailer.service'
import { PrismaService } from '../prisma/prisma.service'
import { LoginDto } from './dto/login.dto'
import { SignupDto } from './dto/signup.dto'

@Injectable()
export class AuthService {
  private readonly prismaService: PrismaService
  private readonly logger = new Logger(AuthService.name)
  private readonly mailerService: MailerService
  private readonly jwtService: JwtService

  constructor(
    prismaService: PrismaService,
    mailerService: MailerService,
    jwtService: JwtService,
  ) {
    this.prismaService = prismaService
    this.mailerService = mailerService
    this.jwtService = jwtService
  }

  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10)
    return bcrypt.hash(password, salt)
  }

  generateVerificationToken(): string {
    // random 6 digit number as array of numbers
    return randomInt(100000, 1000000).toString()
  }

  async signup(signupDto: SignupDto) {
    const { email, password, language } = signupDto

    const verificationToken = this.generateVerificationToken()

    try {
      return await this.prismaService.$transaction(async (prisma) => {
        const user = await prisma.user.create({
          data: {
            email,
            password: await this.hashPassword(password),
          },
        })
        const ten_minutes_in_ms = 10 * 60 * 1000 // 10 minutes in milliseconds
        await prisma.token.create({
          data: {
            token: verificationToken,
            type: TokenType.EMAIL_VERIFICATION,
            userId: user.id,
            expiresAt: new Date(Date.now() + ten_minutes_in_ms), // 10 minutes from now
          },
        })

        this.logger.log(
          `User created with ID: ${user.id} | Email: ${user.email} | Verification Token: ${verificationToken}`,
        )

        await this.mailerService.sendVerificationCodeMail(
          user.email,
          language,
          {
            codeDigits: verificationToken.split(''),
          },
        )

        return {
          userId: user.id,
          email: user.email,
          verificationSent: true,
        }
      })
    } catch (error) {
      // Handle Prisma-specific errors and convert to HTTP exceptions
      if (error.code === 'P2002') {
        throw new ConflictException('Email already in use')
      }

      // Log and throw generic error for unexpected cases
      this.logger.error(`Signup failed: ${error.message}`, error.stack)
      throw new BadRequestException('Failed to create account')
    }
  }

  async verifyAccountToken(email: string, token: string) {
    try {
      // First, check if token exists and is expired OUTSIDE the transaction
      const tokenEntity = await this.prismaService.token.findFirst({
        where: { token, type: TokenType.EMAIL_VERIFICATION, user: { email } },
        include: {
          user: {
            select: { id: true, email: true, isVerified: true },
          },
        },
      })

      // Check if token exists
      if (!tokenEntity) {
        throw new BadRequestException('Invalid verification token')
      }

      // Check if token is expired and handle it OUTSIDE transaction
      if (tokenEntity.expiresAt < new Date()) {
        // Delete expired token outside transaction
        await this.prismaService.token.deleteMany({
          where: {
            token: tokenEntity.token,
            userId: tokenEntity.userId,
            type: TokenType.EMAIL_VERIFICATION,
          },
        })
        // Now throw the error after deletion is completed
        throw new BadRequestException('Token has expired')
      }

      // If token is valid, proceed with verification in transaction
      return await this.prismaService.$transaction(async (prisma) => {
        const { userId } = tokenEntity

        const updatedUser = await prisma.user.update({
          where: { id: userId },
          data: { isVerified: true },
          select: { id: true, email: true, isVerified: true },
        })

        await prisma.token.deleteMany({
          where: { userId, type: TokenType.EMAIL_VERIFICATION },
        })

        return {
          userId: updatedUser.id,
          email: updatedUser.email,
          isVerified: updatedUser.isVerified,
        }
      })
    } catch (error) {
      if (error.status) {
        throw error
      }
      this.logger.error(
        `Account verification failed: ${error.message}`,
        error.stack,
      )
      throw new BadRequestException('Failed to verify account')
    }
  }

  private async verifyPassword(
    plainText: string,
    hashedPassword: string,
  ): Promise<boolean> {
    try {
      return await bcrypt.compare(plainText, hashedPassword)
    } catch (error) {
      this.logger.error(`Password verification failed: ${error.message}`)
      return false
    }
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto

    try {
      // Find user by email with selected fields only
      const user = await this.prismaService.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          password: true,
          isVerified: true,
          role: true,
        },
      })

      // Check if user exists
      if (!user) {
        throw new UnauthorizedException('Invalid email or password')
      }

      // Verify password
      const isPasswordValid = await this.verifyPassword(password, user.password)
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid email or password')
      }

      // Check if user has verified their email
      if (!user.isVerified) {
        throw new UnauthorizedException(
          'Please verify your email address before logging in',
        )
      }

      const tokens = this.generateTokens(user.id, user.email, user.role)

      this.logger.log(
        `User logged in successfully: ${user.email} (ID: ${user.id})`,
      )

      return tokens
    } catch (error) {
      // If it's already an HTTP exception, re-throw it
      if (error.status) {
        throw error
      }

      // Log and throw generic error for unexpected cases
      this.logger.error(
        `Login failed for email ${email}: ${error.message}`,
        error.stack,
      )
      throw new UnauthorizedException('Login failed. Please try again.')
    }
  }

  private generateTokens(userId: string, email: string, role: string) {
    const now = Math.floor(Date.now() / 1000)
    const accessTokenExpiresIn = 15 * 60 // 15 minutes
    const refreshTokenExpiresIn = 7 * 24 * 60 * 60 // 7 days

    const accessTokenPayload = {
      sub: userId,
      email,
      role,
      type: 'access',
      iat: now,
    }
    const refreshTokenPayload = {
      sub: userId,
      type: 'refresh',
      iat: now,
    }

    const accessToken = this.jwtService.sign(accessTokenPayload, {
      expiresIn: accessTokenExpiresIn,
    })
    const refreshToken = this.jwtService.sign(refreshTokenPayload, {
      expiresIn: refreshTokenExpiresIn,
    })

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      scope: 'read write',
    }
  }

  async refreshTokens(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing')
    }
    try {
      const payload = this.jwtService.verify(refreshToken)
      if (!payload || payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid refresh token')
      }

      const user = await this.prismaService.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, role: true, isVerified: true },
      })
      if (!user) {
        throw new UnauthorizedException('User not found')
      }
      if (!user.isVerified) {
        throw new UnauthorizedException('Email not verified')
      }

      const tokens = this.generateTokens(user.id, user.email, user.role)
      this.logger.log(`Refresh token rotated for user ${user.email}`)
      return tokens
    } catch (error) {
      if (error.status) {
        throw error
      }
      this.logger.error(`Refresh token failed: ${error.message}`)
      throw new UnauthorizedException('Invalid or expired refresh token')
    }
  }
}
