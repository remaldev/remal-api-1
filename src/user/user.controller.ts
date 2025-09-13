import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
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
import { Role } from '@prisma/client'
import { CurrentUser, Roles } from 'src/auth/decorators'
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard'
import { RolesGuard } from 'src/auth/guards/roles.guard'
import { AuthenticatedUser } from 'src/auth/interfaces'
import { CreateUserDto } from './dto/create-user.dto'
import { UserResponseDto } from './dto/user-response.dto'
import { UserService } from './user.service'

@ApiTags('Users')
@Controller('user')
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UserController {
  private readonly userService: UserService

  constructor(userService: UserService) {
    this.userService = userService
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new user',
    description: 'Creates a new user with the provided information',
  })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User created successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Record with this data already exists',
  })
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto)
  }

  @Roles(Role.ADMIN, Role.USER)
  @Get('profile')
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Get the authenticated user profile information',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User profile retrieved successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.userService.getUserById(user.id)
  }
}
