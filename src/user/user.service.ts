import { Injectable } from '@nestjs/common'
import { CreateUserDto } from './dto/create-user.dto'
import { PrismaService } from '../prisma/prisma.service'
import * as bcrypt from 'bcrypt'
import { toUserResponseDto } from './utils/user.mapper'


@Injectable()
export class UserService {
  private readonly prismaService: PrismaService

  constructor(prismaService: PrismaService) {
    this.prismaService = prismaService
  }
  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10)
    return bcrypt.hash(password, salt)
  }

  comparePasswords(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }

  async create(createUserDto: CreateUserDto) {
    const createdUser = await this.prismaService.user.create({
      data: {
        ...createUserDto,
        password: await this.hashPassword(createUserDto.password),
      },
    })
    const userDto = toUserResponseDto(createdUser)
    return userDto
  }
}
