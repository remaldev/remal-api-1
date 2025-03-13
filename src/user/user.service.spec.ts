import { Test, TestingModule } from '@nestjs/testing'
import { UserService } from './user.service'
import * as bcrypt from 'bcrypt'
import { PrismaService } from '../prisma/prisma.service'
import { ConfigService } from '@nestjs/config'

describe('UserService (unit)', () => {
  let userService: UserService
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService, PrismaService, ConfigService],
    }).compile()
    userService = module.get<UserService>(UserService)
  })

  it('should be defined', () => {
    expect(userService).toBeDefined()
  })

  it('should hash password correctly and match when compared', async () => {
    const password = 'testPassword'
    const hashedPassword = await userService.hashPassword(password) // '10' is the salt rounds
    const isMatch = await userService.comparePasswords(password, hashedPassword)

    expect(isMatch).toBe(true) // The comparison should succeed
  })

  it('should fail comparison if passwords do not match', async () => {
    const password = 'testPassword'
    const wrongPassword = 'wrongPassword'
    const hashedPassword = await userService.hashPassword(password)
    const isMatch = await userService.comparePasswords(
      wrongPassword,
      hashedPassword,
    )

    expect(isMatch).toBe(false)
  })

  it('should throw an error if bcrypt fails to hash', async () => {
    const password = 'testPassword'
    jest.spyOn(bcrypt, 'hash').mockImplementation(() => { throw new Error('Hashing failed') })

    try {
      await userService.hashPassword(password)
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
      expect(error.message).toBe('Hashing failed')
    }
  })
})
