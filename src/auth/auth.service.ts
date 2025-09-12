import { randomInt } from 'node:crypto'
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
} from '@nestjs/common'
import { TokenType } from '@prisma/client'
import * as bcrypt from 'bcrypt'
import { MailerService } from '../mailer/mailer.service'
import { PrismaService } from '../prisma/prisma.service'
import { SignupDto } from './dto/signup.dto'

@Injectable()
export class AuthService {
  private readonly prismaService: PrismaService
  private readonly logger = new Logger(AuthService.name)
  private readonly mailerService: MailerService

  constructor(prismaService: PrismaService, mailerService: MailerService) {
    this.prismaService = prismaService
    this.mailerService = mailerService
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

    // Business logic validation - throw HTTP exceptions directly
    if (!email || !password) {
      throw new BadRequestException('Email and password are required')
    }

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

      // If it's already an HTTP exception, re-throw it
      if (error.status) {
        throw error
      }

      // Log and throw generic error for unexpected cases
      this.logger.error(`Signup failed: ${error.message}`, error.stack)
      throw new BadRequestException('Failed to create account')
    }
  }

  async verifyAccountToken(email: string, token: string) {
    try {
      return await this.prismaService.$transaction(async (prisma) => {
        const tokenEntity = await prisma.token.findFirstOrThrow({
          where: { token, type: TokenType.EMAIL_VERIFICATION, user: { email } },
          include: {
            user: {
              select: { id: true, email: true, isVerified: true },
            },
          },
        })
        console.log(tokenEntity)

        if (tokenEntity.expiresAt < new Date()) {
          await prisma.token.deleteMany({
            where: {
              token: tokenEntity.token,
              userId: tokenEntity.userId,
              type: TokenType.EMAIL_VERIFICATION,
            },
          })
          throw new BadRequestException('Token has expired')
        }

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
      console.log(error)
      if (error.status) {
        throw error
      }
      if (error.code === 'P2025') {
        // prisma code P2025 means: "An operation failed because it depends on one or more records that were required but not found. {cause}"
        throw new BadRequestException('Invalid verification token')
      }
      if (error.code === 'P2023') {
        throw new BadRequestException('Verification token is invalid')
      }
      this.logger.error(
        `Account verification failed: ${error.message}`,
        error.stack,
      )
      throw new BadRequestException('Failed to verify account')
    }
  }
}
