import { HttpStatus, INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { TokenType } from '@prisma/client'
import * as request from 'supertest'
import { bootstrapApp } from '../../src/app.bootstrap'
import { AppModule } from '../../src/app.module'
import { SignupDto } from '../../src/auth/dto/signup.dto'
import { Role } from '../../src/auth/enums'
import { MailerService } from '../../src/mailer/mailer.service'
import { PrismaService } from '../../src/prisma/prisma.service'
import { isValidDate } from '../helpers/test-matchers'

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

describe('Auth Login (e2e)', () => {
  let app: INestApplication
  let prismaService: PrismaService
  let defaultVerifiedUser: {
    email: string
    password: string
    language: 'en' | 'ar'
    userId: string
  }

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

    // Create a default verified user for reuse across tests
    defaultVerifiedUser = await createVerifiedUser()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  // Helper function to create and verify a user for login tests
  const createVerifiedUser = async (
    userData = {
      email: 'test@example.com',
      password: 'TestPass123!',
      language: 'en' as const,
    },
  ) => {
    // Create user via signup
    const signupResponse = await request(app.getHttpServer())
      .post('/auth/signup')
      .send(userData)
      .expect(HttpStatus.CREATED)

    const userId = signupResponse.body.data.userId

    // Get verification token from database
    const token = await prismaService.token.findFirst({
      where: {
        userId,
        type: 'EMAIL_VERIFICATION',
      },
    })

    if (!token) {
      throw new Error('Verification token not found')
    }

    // Verify the user
    await request(app.getHttpServer())
      .get(`/auth/verify/${token.token}?email=${userData.email}`)
      .expect(HttpStatus.OK)

    return { ...userData, userId }
  }

  describe('/auth/login (POST)', () => {
    it('should login successfully with valid credentials and return access token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: defaultVerifiedUser.email,
          password: defaultVerifiedUser.password,
        })
        .expect(HttpStatus.OK)

      expect(response.body).toEqual({
        success: true,
        message: 'Login successful',
        data: {
          access_token: expect.any(String),
          token_type: 'Bearer',
          scope: 'read write',
        },
      })

      // Verify refresh token cookie is set
      const setCookieHeader = response.headers['set-cookie']
      const cookies = Array.isArray(setCookieHeader)
        ? setCookieHeader
        : [setCookieHeader]
      const refreshTokenCookie = cookies?.find((cookie) =>
        cookie?.startsWith('refreshToken='),
      )
      expect(refreshTokenCookie).toBeDefined()
      expect(refreshTokenCookie).toContain('HttpOnly')
      expect(refreshTokenCookie).toContain('SameSite=Strict')
    })

    it('should return 401 for invalid password', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: defaultVerifiedUser.email,
          password: 'WrongPassword123!',
        })
        .expect(HttpStatus.UNAUTHORIZED)

      expect(response.body.message).toBe('Invalid email or password')
    })

    it('should return 401 for non-existent user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'TestPass123!',
        })
        .expect(HttpStatus.UNAUTHORIZED)

      expect(response.body.message).toBe('Invalid email or password')
    })

    it('should return 401 for unverified user', async () => {
      // Create user but don't verify
      const userData = {
        email: 'unverified@example.com',
        password: 'TestPass123!',
        language: 'en' as const,
      }

      await request(app.getHttpServer())
        .post('/auth/signup')
        .send(userData)
        .expect(HttpStatus.CREATED)

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(HttpStatus.UNAUTHORIZED)

      expect(response.body.message).toBe(
        'Please verify your email address before logging in',
      )
    })

    it('should return 400 for invalid email format', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'invalid-email',
          password: 'TestPass123!',
        })
        .expect(HttpStatus.BAD_REQUEST)

      expect(response.body.message).toContain(
        'Please provide a valid email address',
      )
    })

    it('should return 400 for password shorter than 6 characters', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: '123',
        })
        .expect(HttpStatus.BAD_REQUEST)

      expect(response.body.message).toContain(
        'Password must be at least 6 characters long',
      )
    })

    it('should handle password verification errors gracefully', async () => {
      // Mock bcrypt.compare to throw an error
      const bcrypt = require('bcrypt')
      const originalCompare = bcrypt.compare
      jest.spyOn(bcrypt, 'compare').mockImplementationOnce(() => {
        throw new Error('Bcrypt internal error')
      })

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: defaultVerifiedUser.email,
          password: defaultVerifiedUser.password,
        })
        .expect(HttpStatus.UNAUTHORIZED)

      expect(response.body.message).toBe('Invalid email or password')

      // Restore original implementation
      bcrypt.compare = originalCompare
    })

    it('should handle unexpected database errors during login gracefully', async () => {
      // Mock prismaService.user.findUnique to throw an unexpected error
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockImplementationOnce(() => {
          throw new Error('Database connection lost')
        })

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: defaultVerifiedUser.email,
          password: defaultVerifiedUser.password,
        })
        .expect(HttpStatus.UNAUTHORIZED)

      expect(response.body.message).toBe('Login failed. Please try again.')

      // Restore original implementation
      jest.restoreAllMocks()
    })

    it('should return 401 when accessing protected routes with valid token but user deleted', async () => {
      const verifiedUserToUnverifyLater = await createVerifiedUser({
        email: 'unverified2@example.com',
        password: 'TestPass123!',
        language: 'en' as const,
      })
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: verifiedUserToUnverifyLater.email,
          password: verifiedUserToUnverifyLater.password,
        })
        .expect(HttpStatus.OK)

      const accessToken = loginResponse.body.data.access_token
      // Delete the user manually to simulate user deletion after token issuance
      await prismaService.user.delete({
        where: { id: verifiedUserToUnverifyLater.userId },
      })

      // Try to access protected user profile endpoint
      const response = await request(app.getHttpServer())
        .get('/user/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.UNAUTHORIZED)

      expect(response.body.message).toBe('User not found')
    })

    it('should return 401 when accessing protected routes with valid token but user unverified', async () => {
      const verifiedUserToUnverifyLater = await createVerifiedUser({
        email: 'unverified3@example.com',
        password: 'TestPass123!',
        language: 'en' as const,
      })
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: verifiedUserToUnverifyLater.email,
          password: verifiedUserToUnverifyLater.password,
        })
        .expect(HttpStatus.OK)

      const accessToken = loginResponse.body.data.access_token

      // Unverify the user manually to simulate verification revocation after token issuance
      await prismaService.user.update({
        where: { id: verifiedUserToUnverifyLater.userId },
        data: { isVerified: false },
      })

      // Try to access protected user profile endpoint
      const response = await request(app.getHttpServer())
        .get('/user/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.UNAUTHORIZED)

      expect(response.body.message).toBe('Email not verified')
    })
  })

  describe('Protected Routes Access', () => {
    it('should successfully access user profile with valid JWT token', async () => {
      // Login to get access token
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: defaultVerifiedUser.email,
          password: defaultVerifiedUser.password,
        })
        .expect(HttpStatus.OK)
      const accessToken = loginResponse.body.data.access_token

      // Access protected user profile endpoint
      const response = await request(app.getHttpServer())
        .get('/user/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.OK)

      expect(response.body).toEqual({
        id: defaultVerifiedUser.userId,
        email: defaultVerifiedUser.email,
        role: Role.USER,
        name: null,
        username: null,
        isVerified: true,
        createdAt: isValidDate,
        updatedAt: isValidDate,
      })
    })

    it('should successfully access protected user route with valid JWT token', async () => {
      // Login to get access token
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: defaultVerifiedUser.email,
          password: defaultVerifiedUser.password,
        })
        .expect(HttpStatus.OK)
      const accessToken = loginResponse.body.data.access_token

      // Access protected auth user route
      const response = await request(app.getHttpServer())
        .get('/auth/protected/user')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.OK)

      expect(response.body).toEqual({
        message: 'You have accessed a protected USER route',
        user: {
          id: defaultVerifiedUser.userId,
          email: defaultVerifiedUser.email,
          role: Role.USER,
          isVerified: true,
        },
      })
    })

    it('should return 403 when user tries to access admin-only route', async () => {
      // Login to get access token
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: defaultVerifiedUser.email,
          password: defaultVerifiedUser.password,
        })
        .expect(HttpStatus.OK)

      const accessToken = loginResponse.body.data.access_token

      // Try to access admin-only route
      await request(app.getHttpServer())
        .get('/auth/protected/admin')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.FORBIDDEN)
    })

    it('should return 401 when accessing protected routes without token', async () => {
      // Try to access protected routes without authorization header
      await request(app.getHttpServer())
        .get('/user/profile')
        .expect(HttpStatus.UNAUTHORIZED)

      await request(app.getHttpServer())
        .get('/auth/protected/user')
        .expect(HttpStatus.UNAUTHORIZED)

      await request(app.getHttpServer())
        .get('/auth/protected/admin')
        .expect(HttpStatus.UNAUTHORIZED)
    })

    it('should return 401 when accessing protected routes with invalid token', async () => {
      const invalidToken = 'invalid.jwt.token'

      // Try to access protected routes with invalid token
      await request(app.getHttpServer())
        .get('/user/profile')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(HttpStatus.UNAUTHORIZED)

      await request(app.getHttpServer())
        .get('/auth/protected/user')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(HttpStatus.UNAUTHORIZED)

      await request(app.getHttpServer())
        .get('/auth/protected/admin')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(HttpStatus.UNAUTHORIZED)
    })

    it('should return 401 when accessing protected routes with malformed authorization header', async () => {
      // Try to access protected routes with malformed authorization header
      await request(app.getHttpServer())
        .get('/user/profile')
        .set('Authorization', 'InvalidFormat token')
        .expect(HttpStatus.UNAUTHORIZED)

      await request(app.getHttpServer())
        .get('/auth/protected/user')
        .set('Authorization', 'Bearer')
        .expect(HttpStatus.UNAUTHORIZED)

      await request(app.getHttpServer())
        .get('/auth/protected/admin')
        .set('Authorization', 'NoBearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9')
        .expect(HttpStatus.UNAUTHORIZED)
    })

    it('should return 401 when accessing protected routes with expired token', async () => {
      // Create an expired JWT token (expired 1 hour ago)
      const jwt = require('jsonwebtoken')
      const expiredToken = jwt.sign(
        {
          sub: defaultVerifiedUser.userId,
          email: defaultVerifiedUser.email,
          role: Role.USER,
          isVerified: true,
        },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '-1h' }, // Expired 1 hour ago
      )

      // Try to access protected routes with expired token
      await request(app.getHttpServer())
        .get('/user/profile')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(HttpStatus.UNAUTHORIZED)

      await request(app.getHttpServer())
        .get('/auth/protected/user')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(HttpStatus.UNAUTHORIZED)

      await request(app.getHttpServer())
        .get('/auth/protected/admin')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(HttpStatus.UNAUTHORIZED)
    })

    it('should return 500 when unexpected error occurs during JWT validation', async () => {
      // Get a valid token first
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: defaultVerifiedUser.email,
          password: defaultVerifiedUser.password,
        })
        .expect(HttpStatus.OK)

      const accessToken = loginResponse.body.data.access_token

      // Mock prismaService.user.findUnique to throw an unexpected error (not a status error)
      const originalFindUnique = prismaService.user.findUnique
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockImplementationOnce(() => {
          throw new Error('Unexpected database crash')
        })

      // Try to access protected route - should get 500 Internal Server Error
      const response = await request(app.getHttpServer())
        .get('/user/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.INTERNAL_SERVER_ERROR)

      expect(response.body.message).toBe('Internal server error')

      // Restore original implementation
      prismaService.user.findUnique = originalFindUnique
    })
  })

  describe('Role-based Access Control', () => {
    it('should allow admin user to access both admin and user protected routes', async () => {
      // Create admin user by manually updating role in database
      const adminUserData = await createVerifiedUser({
        email: 'admin@example.com',
        password: 'AdminPass123!',
        language: 'en' as const,
      })

      // Update user role to ADMIN
      await prismaService.user.update({
        where: { id: adminUserData.userId },
        data: { role: Role.ADMIN },
      })

      // Login as admin
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: adminUserData.email,
          password: adminUserData.password,
        })
        .expect(HttpStatus.OK)
      const accessToken = loginResponse.body.data.access_token

      // Admin should access admin route
      const adminResponse = await request(app.getHttpServer())
        .get('/auth/protected/admin')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.OK)

      expect(adminResponse.body).toEqual({
        message: 'You have accessed a protected ADMIN route',
        user: {
          id: adminUserData.userId,
          email: adminUserData.email,
          role: Role.ADMIN,
          isVerified: true,
        },
      })

      // Admin should also access user route
      const userResponse = await request(app.getHttpServer())
        .get('/auth/protected/user')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.OK)

      expect(userResponse.body).toEqual({
        message: 'You have accessed a protected USER route',
        user: {
          id: adminUserData.userId,
          email: adminUserData.email,
          role: Role.ADMIN,
          isVerified: true,
        },
      })

      // Admin should access user profile
      await request(app.getHttpServer())
        .get('/user/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.OK)
    })

    it('should verify JWT token contains correct user information and roles', async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: defaultVerifiedUser.email,
          password: defaultVerifiedUser.password,
        })
        .expect(HttpStatus.OK)

      const accessToken = loginResponse.body.data.access_token

      // Verify token works and returns correct user data via protected route
      const response = await request(app.getHttpServer())
        .get('/auth/protected/user')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.OK)

      expect(response.body.user).toEqual({
        id: defaultVerifiedUser.userId,
        email: defaultVerifiedUser.email,
        role: Role.USER,
        isVerified: true,
      })
    })
  })
})
