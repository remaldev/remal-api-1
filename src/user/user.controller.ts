import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common'
import { UserService } from './user.service'
import type { CreateUserDto } from './dto/user.dto'

@Controller('user')
export class UserController {
  private readonly userService: UserService
  constructor(userService: UserService) {
    this.userService = userService
  }

  @Post()
  createUser(@Body() userCreateDto: CreateUserDto) {
    return this.userService.createUser(userCreateDto)
  }

  @Get()
  getHello() {
    return this.userService.getUsers()
  }

  @Get('count')
  async countUsers() {
    return { count: await this.userService.countUsers() }
  }

  @Get(':id')
  getUserById(@Param('id') id: string) {
    return this.userService.getUserById(id)
  }

  @Delete(':id')
  deleteUserById(@Param('id') id: string) {
    return this.userService.deleteUser(id)
  }

  @Patch(':id')
  updateUserById(
    @Param('id') id: string,
    @Body() userUpdateDto: CreateUserDto,
  ) {
    return this.userService.updateUser(id, userUpdateDto)
  }

  @Get('email/:email')
  getUserByEmail(@Param('email') email: string) {
    return this.userService.getUserByEmail(email)
  }
}
