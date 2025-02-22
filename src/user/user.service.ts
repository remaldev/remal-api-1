import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {
    console.log('UserService instantiated');
  }
  async createUser(data: { name: string; email: string }) {
    return this.prisma.user.create({ data });
  }

  async getUsers() {
    return this.prisma.user.findMany();
  }
}
