import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpCode,
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
import { CurrentUser, Public, Roles } from './decorators'
import { LoginDto } from './dto/login.dto'
import { SignupDto } from './dto/signup.dto'
import { Role } from './enums'
import { JwtAuthGuard } from './guards/jwt-auth.guard'
import { RolesGuard } from './guards/roles.guard'
import {
  ErrorEnvelopeDto,
  SuccessEnvelopeDto,
} from '../common/dto/response-envelope.dto'

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
    type: SuccessEnvelopeDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or missing required fields',
    type: ErrorEnvelopeDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email address is already registered',
    type: ErrorEnvelopeDto,
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
    type: SuccessEnvelopeDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid token, expired token, or user not found',
    type: ErrorEnvelopeDto,
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
  @HttpCode(HttpStatus.OK)
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
      'User authenticated successfully. The refresh token is set in an HTTP-only cookie (refreshToken).',
    type: SuccessEnvelopeDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials or unverified email',
    type: ErrorEnvelopeDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
    type: ErrorEnvelopeDto,
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

    return {
      success: true,
      message: 'Login successful',
      data: responseData,
    }
  }

  @Roles(Role.ADMIN)
  @Get('protected/admin')
  protectedAdminRoute(@CurrentUser() user) {
    return {
      message: 'You have accessed a protected ADMIN route',
      user,
    }
  }

  @Roles(Role.ADMIN, Role.USER)
  @Get('protected/user')
  protectedUserRoute(@CurrentUser() user) {
    return {
      message: 'You have accessed a protected USER route',
      user,
    }
  }
}
