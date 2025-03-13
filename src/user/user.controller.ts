import {
  Controller,
  Post,
  Body,
  HttpStatus,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger'
import { UserService } from './user.service'
import { CreateUserDto } from './dto/create-user.dto'
import { UserResponseDto } from './dto/user-response.dto'

@ApiTags('Users')
@Controller('user')
@UseInterceptors(ClassSerializerInterceptor)
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
}
