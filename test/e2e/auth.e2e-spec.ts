import { HttpStatus, INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { TokenType } from '@prisma/client'
import * as request from 'supertest'
import { bootstrapApp } from '../../src/app.bootstrap'
import { AppModule } from '../../src/app.module'
import { SignupDto } from '../../src/auth/dto/signup.dto'
import { MailerService } from '../../src/mailer/mailer.service'
import { PrismaService } from '../../src/prisma/prisma.service'

describe('Auth Signup (e2e)', () => {
  let app: INestApplication
  let prismaService: PrismaService
  let mailerService: MailerService

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MailerService)
      .useValue({
        sendVerificationCodeMail: jest.fn().mockResolvedValue(true),
      })
      .compile()

    app = moduleFixture.createNestApplication()
    bootstrapApp(app)
    await app.init()

    prismaService = app.get<PrismaService>(PrismaService)
    mailerService = app.get<MailerService>(MailerService)
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(async () => {
    // Clean up database before each test
    await prismaService.token.deleteMany()
    await prismaService.user.deleteMany()
    jest.clearAllMocks()
  })

  describe('/auth/signup (POST)', () => {
    const validSignupDto: SignupDto = {
      email: 'test@example.com',
      password: 'TestPass123!',
      language: 'en',
    }

    it('should create user successfully with valid data', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(validSignupDto)
        .expect(HttpStatus.CREATED)

      expect(response.body).toEqual({
        success: true,
        message:
          'User registered successfully. Please check your email for verification code.',
        data: {
          userId: expect.any(String),
          email: validSignupDto.email,
          verificationSent: true,
        },
      })

      // Verify user was created in database
      const user = await prismaService.user.findUnique({
        where: { email: validSignupDto.email },
        include: { Token: true },
      })

      expect(user).toBeTruthy()
      if (user) {
        expect(user.email).toBe(validSignupDto.email)
        expect(user.isVerified).toBe(false)
        expect(user.password).not.toBe(validSignupDto.password) // Should be hashed
        expect(user.Token).toHaveLength(1)
        expect(user.Token[0].type).toBe('EMAIL_VERIFICATION')
        expect(user.Token[0].token).toMatch(/^\d{6}$/) // 6-digit verification code
      }

      // Verify mailer was called
      expect(mailerService.sendVerificationCodeMail).toHaveBeenCalledWith(
        validSignupDto.email,
        validSignupDto.language,
        {
          codeDigits: expect.any(Array),
        },
      )
    })

    it('should create user with Arabic language preference', async () => {
      const signupDto = { ...validSignupDto, language: 'ar' as const }

      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(signupDto)
        .expect(HttpStatus.CREATED)

      expect(response.body.data.email).toBe(signupDto.email)

      // Verify mailer was called with Arabic language
      expect(mailerService.sendVerificationCodeMail).toHaveBeenCalledWith(
        signupDto.email,
        'ar',
        {
          codeDigits: expect.any(Array),
        },
      )
    })

    it('should return conflict error when email already exists', async () => {
      // Create user first time
      await request(app.getHttpServer())
        .post('/auth/signup')
        .send(validSignupDto)
        .expect(HttpStatus.CREATED)

      // Try to create same user again
      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(validSignupDto)
        .expect(HttpStatus.CONFLICT)

      expect(response.body.message).toBe('Email already in use')
      expect(response.body.statusCode).toBe(409)

      // Verify mailer was only called once (for first signup)
      expect(mailerService.sendVerificationCodeMail).toHaveBeenCalledTimes(1)
    })

    it('should return bad request for invalid email format', async () => {
      const invalidEmailDto = { ...validSignupDto, email: 'invalid-email' }

      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(invalidEmailDto)
        .expect(HttpStatus.BAD_REQUEST)

      expect(response.body.message).toContain(
        'Please provide a valid email address',
      )

      // Verify no user was created
      const user = await prismaService.user.findUnique({
        where: { email: invalidEmailDto.email },
      })
      expect(user).toBeNull()

      // Verify mailer was not called
      expect(mailerService.sendVerificationCodeMail).not.toHaveBeenCalled()
    })

    it('should return bad request for weak password', async () => {
      const weakPasswordDto = { ...validSignupDto, password: '123' }

      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(weakPasswordDto)
        .expect(HttpStatus.BAD_REQUEST)

      expect(response.body.message).toContain(
        'Password must be at least 6 characters long',
      )

      // Verify no user was created
      const user = await prismaService.user.findUnique({
        where: { email: validSignupDto.email },
      })
      expect(user).toBeNull()

      // Verify mailer was not called
      expect(mailerService.sendVerificationCodeMail).not.toHaveBeenCalled()
    })

    it('should return bad request for password without special characters', async () => {
      const noSpecialCharDto = { ...validSignupDto, password: 'TestPass123' }

      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(noSpecialCharDto)
        .expect(HttpStatus.BAD_REQUEST)

      expect(response.body.message).toContain(
        'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
      )

      // Verify no user was created
      const user = await prismaService.user.findUnique({
        where: { email: validSignupDto.email },
      })
      expect(user).toBeNull()

      // Verify mailer was not called
      expect(mailerService.sendVerificationCodeMail).not.toHaveBeenCalled()
    })

    it('should return bad request for invalid language', async () => {
      const invalidLanguageDto = {
        ...validSignupDto,
        language: 'fr' as 'en' | 'ar',
      }

      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(invalidLanguageDto)
        .expect(HttpStatus.BAD_REQUEST)

      expect(response.body.message).toContain(
        'Language must be either "en" (English) or "ar" (Arabic)',
      )

      // Verify no user was created
      const user = await prismaService.user.findUnique({
        where: { email: validSignupDto.email },
      })
      expect(user).toBeNull()

      // Verify mailer was not called
      expect(mailerService.sendVerificationCodeMail).not.toHaveBeenCalled()
    })

    it('should return bad request for missing email', async () => {
      // biome-ignore lint/correctness/noUnusedVariables: we want to exclude it
      const { email, ...noEmailDto } = validSignupDto

      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(noEmailDto)
        .expect(HttpStatus.BAD_REQUEST)

      expect(response.body.message).toContain('Email is required')

      // Verify mailer was not called
      expect(mailerService.sendVerificationCodeMail).not.toHaveBeenCalled()
    })

    it('should return bad request for missing password', async () => {
      // biome-ignore lint/correctness/noUnusedVariables: we want to extract it
      const { password, ...noPasswordDto } = validSignupDto
      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(noPasswordDto)
        .expect(HttpStatus.BAD_REQUEST)

      expect(response.body.message).toContain('Password is required')

      // Verify mailer was not called
      expect(mailerService.sendVerificationCodeMail).not.toHaveBeenCalled()
    })

    it('should trim email whitespace and convert to lowercase', async () => {
      const emailWithWhitespace = {
        ...validSignupDto,
        email: '  TEST@example.com  ',
      }

      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(emailWithWhitespace)
        .expect(HttpStatus.CREATED)

      expect(response.body.data.email).toBe('test@example.com')

      // Verify user was created with trimmed email
      const user = await prismaService.user.findUnique({
        where: { email: 'test@example.com' },
      })
      expect(user).toBeTruthy()
    })

    it('should handle mailer service failure gracefully', async () => {
      // Mock mailer to throw error
      jest
        .spyOn(mailerService, 'sendVerificationCodeMail')
        .mockRejectedValueOnce(new Error('Email service unavailable'))

      await request(app.getHttpServer())
        .post('/auth/signup')
        .send(validSignupDto)
        .expect(HttpStatus.BAD_REQUEST)

      // Verify user and token were not created due to transaction rollback
      const user = await prismaService.user.findUnique({
        where: { email: validSignupDto.email },
      })
      expect(user).toBeNull()
    })

    it('should return 400 when verifying token after user is deleted', async () => {
      // Create user first
      const signupResponse = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(validSignupDto)
        .expect(HttpStatus.CREATED)

      const userId = signupResponse.body.data.userId

      // Get verification token
      const token = await prismaService.token.findFirst({
        where: {
          userId,
          type: 'EMAIL_VERIFICATION',
        },
      })

      if (!token) {
        throw new Error('Verification token not found')
      }
      await prismaService.token.deleteMany({
        where: { userId },
      })
      // Delete the user manually to simulate P2025 error during verification
      await prismaService.user.delete({
        where: { id: userId },
      })

      // Try to verify with token after user is deleted
      const response = await request(app.getHttpServer())
        .get(`/auth/verify/${token.token}?email=${validSignupDto.email}`)
        .expect(HttpStatus.BAD_REQUEST)

      expect(response.body.message).toBe('Invalid verification token')
    })

    it('should handle expired verification token gracefully', async () => {
      // Create user first
      const validSignupDtoTMP = {
        email: 'custom2@example.com',
        password: 'CustomPass123!',
        language: 'en' as const,
      }
      const signupResponse = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(validSignupDtoTMP)
        .expect(HttpStatus.CREATED)

      const userId = signupResponse.body.data.userId

      // Get verification token
      const token = await prismaService.token.findFirst({
        where: {
          userId,
          type: 'EMAIL_VERIFICATION',
        },
      })

      if (!token) {
        throw new Error('Verification token not found')
      }
      await prismaService.token.update({
        where: {
          userId_type: {
            userId,
            type: TokenType.EMAIL_VERIFICATION,
          },
        },
        data: { expiresAt: new Date(Date.now() - 2 * 60 * 60 * 1000) }, // Set to 2 hours in the past to expire it
      })
      const response = await request(app.getHttpServer())
        .get(`/auth/verify/${token.token}?email=${validSignupDtoTMP.email}`)
        .expect(HttpStatus.BAD_REQUEST)

      expect(response.body.message).toBe('Token has expired')
    })

    it('should handle unexpected errors during verification gracefully', async () => {
      // Create user first
      const validSignupDtoTMP = {
        email: 'custom3@example.com',
        password: 'CustomPass123!',
        language: 'en' as const,
      }
      const signupResponse = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(validSignupDtoTMP)
        .expect(HttpStatus.CREATED)

      const userId = signupResponse.body.data.userId

      // Get verification token
      const token = await prismaService.token.findFirst({
        where: {
          userId,
          type: 'EMAIL_VERIFICATION',
        },
      })

      if (!token) {
        throw new Error('Verification token not found')
      }

      // Mock prismaService.token.findFirst to throw an unexpected error
      const originalFindFirst = prismaService.token.findFirst
      jest
        .spyOn(prismaService.token, 'findFirst')
        .mockImplementationOnce(() => {
          throw new Error('Unexpected database crash during verification')
        })

      // Try to verify - should get 400 Bad Request with generic error message
      const response = await request(app.getHttpServer())
        .get(`/auth/verify/${token.token}?email=${validSignupDtoTMP.email}`)
        .expect(HttpStatus.BAD_REQUEST)

      expect(response.body.message).toBe('Failed to verify account')

      // Restore original implementation
      prismaService.token.findFirst = originalFindFirst
    })
  })
})
