import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  HttpStatus,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { AuthService } from './auth.service'
import { Public } from './decorators'
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
}
