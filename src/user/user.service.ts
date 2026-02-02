import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { UserResponseDto } from './dto/user-response.dto'
import { toUserResponseDto } from './utils/user.mapper'

@Injectable()
export class UserService {
  private readonly prismaService: PrismaService

  constructor(prismaService: PrismaService) {
    this.prismaService = prismaService
  }

  async getUserById(id: string): Promise<UserResponseDto | null> {
    const user = await this.prismaService.user.findUnique({ where: { id } })
    return user ? toUserResponseDto(user) : null
  }

  async getUserByEmail(email: string): Promise<UserResponseDto | null> {
    const user = await this.prismaService.user.findUnique({ where: { email } })
    return user ? toUserResponseDto(user) : null
  }
}
