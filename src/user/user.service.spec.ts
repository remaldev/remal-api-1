import { Test, TestingModule } from '@nestjs/testing'
import { Role } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { UserResponseDto } from './dto/user-response.dto'
import { UserService } from './user.service'

describe('UserService', () => {
  let userService: UserService
  let prismaService: PrismaService

  // Mock data that matches what Prisma select returns (without password)
  const mockUser = {
    id: 'user-123',
    email: 'test@remal.ma',
    username: 'testuser' as string | null,
    name: 'Test User' as string | null,
    role: Role.USER,
    isVerified: true,
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    updatedAt: new Date('2025-01-01T00:00:00.000Z'),
  }

  const expectedUserResponse: UserResponseDto = {
    id: 'user-123',
    email: 'test@remal.ma',
    username: 'testuser',
    name: 'Test User',
    role: Role.USER,
    isVerified: true,
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    updatedAt: new Date('2025-01-01T00:00:00.000Z'),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile()

    userService = module.get<UserService>(UserService)
    prismaService = module.get<PrismaService>(PrismaService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getUserById', () => {
    it('should return user data when user is found', async () => {
      // Arrange
      const userId = 'user-123'
      ;(prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

      // Act
      const result = await userService.getUserById(userId)

      // Assert
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      })
      expect(result).toEqual(expectedUserResponse)
    })

    it('should return null when user is not found', async () => {
      // Arrange
      const nonExistentUserId = 'non-existent-id'
      ;(prismaService.user.findUnique as jest.Mock).mockResolvedValue(null)

      // Act
      const result = await userService.getUserById(nonExistentUserId)

      // Assert
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: nonExistentUserId },
      })
      expect(result).toBeNull()
    })

    it('should mock getUserByEmail', async () => {
      // Arrange
      ;(prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

      // Act
      let result = await userService.getUserByEmail(mockUser.email)

      // Assert
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockUser.email },
      })
      expect(result).toEqual(expectedUserResponse)
      // -------------------------- NULL TEST --------------------------
      // Arrange
      ;(prismaService.user.findUnique as jest.Mock).mockResolvedValue(null)

      // Act
      result = await userService.getUserByEmail('invalid_email')

      // Assert
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'invalid_email' },
      })
      expect(result).toBeNull()
    })
  })
})
