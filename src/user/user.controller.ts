import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpStatus,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { Role } from '@prisma/client'
import { CurrentUser, Roles } from '../auth/decorators'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { AuthenticatedUser } from '../auth/interfaces'
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
