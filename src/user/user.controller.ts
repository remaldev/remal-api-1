import { Body, Controller, Get, Post } from '@nestjs/common'
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
}
