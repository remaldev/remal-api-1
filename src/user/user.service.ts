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
    const user = await this.prismaService.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
        password: false, // Don't include password
      },
    })
    return user ? toUserResponseDto(user) : null
  }
}
