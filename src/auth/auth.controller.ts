import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { Response } from 'express'
import { AuthService } from './auth.service'
import { Public } from './decorators'
import { LoginDto } from './dto/login.dto'
import { LoginResponseDto } from './dto/login-response.dto'
import { SignupDto } from './dto/signup.dto'
import { JwtAuthGuard } from './guards/jwt-auth.guard'
import { RolesGuard } from './guards/roles.guard'

@ApiTags('Authentication')
@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AuthController {
  private readonly authService: AuthService

  constructor(authService: AuthService) {
    this.authService = authService
  }

  @Public()
  @Post('signup')
  @ApiOperation({
    summary: 'User registration',
    description:
      'Register a new user account and send email verification code. The user will receive a 6-digit verification code via email that expires in 10 minutes.',
  })
  @ApiBody({
    type: SignupDto,
    description:
      'User registration details including email, password, and preferred language',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User registered successfully. Verification email sent.',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          example: true,
        },
        message: {
          type: 'string',
          example:
            'User registered successfully. Please check your email for verification code.',
        },
        data: {
          type: 'object',
          properties: {
            userId: {
              type: 'string',
              example: 'clm1234567890abcdef',
            },
            email: {
              type: 'string',
              example: 'user@example.com',
            },
            verificationSent: {
              type: 'boolean',
              example: true,
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or missing required fields',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'string',
          example: 'Email and password are required',
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email address is already registered',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 409 },
        message: {
          type: 'string',
          example: 'Email already in use',
        },
        error: { type: 'string', example: 'Conflict' },
      },
    },
  })
  async signup(@Body() signupDto: SignupDto) {
    const result = await this.authService.signup(signupDto)

    return {
      success: true,
      message:
        'User registered successfully. Please check your email for verification code.',
      data: result,
    }
  }

  @Public()
  @Get('verify/:token')
  @ApiOperation({
    summary: 'Verify email address',
    description:
      'Verify user email address using the 6-digit verification code sent during registration. The token must be used within 10 minutes of registration.',
  })
  @ApiParam({
    name: 'token',
    description: '6-digit verification code sent to user email',
    example: '123456',
    schema: {
      type: 'string',
      pattern: '^[0-9]{6}$',
      minLength: 6,
      maxLength: 6,
    },
  })
  @ApiQuery({
    name: 'email',
    description: 'Email address of the user to verify',
    example: 'user@example.com',
    schema: {
      type: 'string',
      format: 'email',
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Email verified successfully. User account is now active.',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          example: true,
        },
        message: {
          type: 'string',
          example: 'Email verified successfully',
        },
        data: {
          type: 'object',
          properties: {
            userId: {
              type: 'string',
              example: 'clm1234567890abcdef',
            },
            email: {
              type: 'string',
              example: 'user@example.com',
            },
            isVerified: {
              type: 'boolean',
              example: true,
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid token, expired token, or user not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          oneOf: [
            { type: 'string', example: 'Token has expired' },
            { type: 'string', example: 'Invalid verification token' },
          ],
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  async verify(@Param('token') token: string, @Query('email') email: string) {
    const result = await this.authService.verifyAccountToken(email, token)

    return {
      success: true,
      message: 'Email verified successfully',
      data: result,
    }
  }

  @Public()
  @Post('login')
  @ApiOperation({
    summary: 'User login',
    description:
      'Authenticate user with email and password. Returns JWT access token for authenticated requests. The refresh token is set in an HTTP-only cookie named refreshToken. User must have verified their email address.',
  })
  @ApiBody({
    type: LoginDto,
    description: 'User login credentials',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'User authenticated successfully. The refresh token is set in an HTTP-only cookie named refreshToken. The response body only contains the access token and related info.',
    type: LoginResponseDto,
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          example: true,
        },
        message: {
          type: 'string',
          example: 'Login successful',
        },
        data: {
          $ref: '#/components/schemas/LoginResponseDto',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials or unverified email',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: {
          oneOf: [
            { type: 'string', example: 'Invalid email or password' },
            {
              type: 'string',
              example: 'Please verify your email address before logging in',
            },
          ],
        },
        error: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'array',
          items: { type: 'string' },
          example: [
            'Please provide a valid email address',
            'Password must be at least 6 characters long',
          ],
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(loginDto)
    const { refresh_token, ...responseData } = result

    response.cookie('refreshToken', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Use HTTPS in production
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
      path: '/',
    })

    return responseData
  }
}
