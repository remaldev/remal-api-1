import { Body, Controller, Get, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  createUser(@Body() userCreateDto: CreateUserDto) {
    return this.userService.createUser(userCreateDto);
  }

  @Get()
  getHello() {
    return this.userService.getUsers();
  }
}
