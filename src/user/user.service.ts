import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { Prisma } from '@prisma/client'

@Injectable()
export class UserService {
  private readonly prisma: PrismaService

  constructor(prisma: PrismaService) {
    this.prisma = prisma
  }

  async createUser(data: Prisma.UserCreateInput) {
    try {
      return await this.prisma.user.create({ data })
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Email already exists')
        }
      }
      throw error
    }
  }

  getUsers(params?: {
    skip?: number
    take?: number
    where?: Prisma.UserWhereInput
    orderBy?: Prisma.UserOrderByWithRelationInput
  }) {
    return this.prisma.user.findMany({
      ...params,
    })
  }

  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    })
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`)
    }
    return user
  }

  async getUserByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    })
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`)
    }
    return user
  }

  async updateUser(id: string, data: Prisma.UserUpdateInput) {
    try {
      return await this.prisma.user.update({
        where: { id },
        data,
      })
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`User with ID ${id} not found`)
        }
      }
      throw error
    }
  }

  async deleteUser(id: string) {
    try {
      return await this.prisma.user.delete({
        where: { id },
      })
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`User with ID ${id} not found`)
        }
      }
      throw error
    }
  }

  countUsers(where?: Prisma.UserWhereInput) {
    return this.prisma.user.count({ where })
  }
}
