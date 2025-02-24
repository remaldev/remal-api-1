import { Test, type TestingModule } from '@nestjs/testing'
import { UserService } from './user.service'
import { PrismaService } from '../prisma/prisma.service'
import { UserModule } from './user.module'
import { PrismaModule } from 'src/prisma/prisma.module'

describe('UserService', () => {
  let userService: UserService

  beforeEach(async () => {
    // Create a testing module
    const module: TestingModule = await Test.createTestingModule({
      imports: [UserModule, PrismaModule],
      providers: [UserService, PrismaService],
    }).compile()

    userService = module.get<UserService>(UserService)
  })

  it('should be defined', () => {
    expect(userService).toBeDefined()
  })

  it('should create a user', async () => {
    const createUserDto = { name: 'John Doe', email: 'john@example.com' }

    const result = await userService.createUser(createUserDto)

    expect(result).toEqual({
      id: expect.any(String),
      name: 'John Doe',
      email: 'john@example.com',
      createdAt: expect.any(Date),
    })
  })
})
