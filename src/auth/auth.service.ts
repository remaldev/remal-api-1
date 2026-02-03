import { createHash, randomInt } from 'node:crypto'
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { TokenType } from '@prisma/client'
import * as bcrypt from 'bcrypt'
import { StringValue } from 'ms'
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
  private readonly configService: ConfigService
  constructor(
    prismaService: PrismaService,
    mailerService: MailerService,
    jwtService: JwtService,
    configService: ConfigService,
  ) {
    this.prismaService = prismaService
    this.mailerService = mailerService
    this.jwtService = jwtService
    this.configService = configService
  }

  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10)
    return bcrypt.hash(password, salt)
  }

  generateVerificationToken(): string {
    // random 6 digit number as array of numbers
    return randomInt(100000, 1000000).toString()
  }

  async signup(signupDto: SignupDto, isVerified = false) {
    const { email, password, language } = signupDto

    const verificationToken = this.generateVerificationToken()

    try {
      return await this.prismaService.$transaction(async (prisma) => {
        const user = await prisma.user.create({
          data: {
            email,
            password: await this.hashPassword(password),
            isVerified,
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
        if (!isVerified) {
          await this.mailerService.sendVerificationCodeMail(
            user.email,
            language,
            {
              codeDigits: verificationToken.split(''),
            },
          )
        }
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
      // Persist hashed refresh token (single active per user)
      await this.saveHashedRefreshToken(user.id, tokens.refresh_token)

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
    const accessTokenExpiresIn =
      this.configService.getOrThrow<StringValue>('JWT_EXPIRES')
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
      // Validate stored hashed token
      const incomingHash = this.hashToken(refreshToken)
      const stored = await this.prismaService.token.findFirst({
        where: { userId: user.id, type: 'REFRESH' },
      })
      if (!stored || stored.token !== incomingHash) {
        // Possible reuse or invalid token: cleanup any existing record to force re-login
        await this.prismaService.token.deleteMany({
          where: { userId: user.id, type: 'REFRESH' },
        })
        throw new UnauthorizedException('Invalid or expired refresh token')
      }
      // Rotation: generate new pair & replace stored hash
      const tokens = this.generateTokens(user.id, user.email, user.role)
      await this.replaceHashedRefreshToken(
        user.id,
        stored.token,
        tokens.refresh_token,
      )
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

  private hashToken(raw: string) {
    return createHash('sha256').update(raw).digest('hex')
  }

  private async saveHashedRefreshToken(userId: string, rawToken: string) {
    const hash = this.hashToken(rawToken)
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
    // Ensure only one REFRESH token per user
    await this.prismaService.token.deleteMany({
      where: { userId, type: 'REFRESH' },
    })
    await this.prismaService.token.create({
      data: {
        token: hash,
        userId,
        type: 'REFRESH',
        expiresAt: new Date(Date.now() + sevenDaysMs),
      },
    })
  }

  private async replaceHashedRefreshToken(
    userId: string,
    previousHash: string,
    newRawToken: string,
  ) {
    const newHash = this.hashToken(newRawToken)
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
    // Replace token atomically: delete then create (composite id prevents simple update by hash change if changed semantics later)
    await this.prismaService.$transaction([
      this.prismaService.token.deleteMany({
        where: { userId, type: 'REFRESH', token: previousHash },
      }),
      this.prismaService.token.create({
        data: {
          token: newHash,
          userId,
          type: 'REFRESH',
          expiresAt: new Date(Date.now() + sevenDaysMs),
        },
      }),
    ])
  }

  async revokeRefreshToken(rawToken: string) {
    try {
      const payload = this.jwtService.verify(rawToken)
      if (!payload || payload.type !== 'refresh') {
        return
      }
      const hash = this.hashToken(rawToken)
      await this.prismaService.token.deleteMany({
        where: { userId: payload.sub, type: 'REFRESH', token: hash },
      })
    } catch {
      // ignore invalid token on logout
    }
  }
}
