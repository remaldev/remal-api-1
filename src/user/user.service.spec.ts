/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from '../prisma/prisma.service'; // Import PrismaService to mock

describe('UserService', () => {
  let userService: UserService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    // Create a testing module
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              create: jest.fn().mockResolvedValue({
                id: 1,
                name: 'John Doe',
                email: 'john@example.com',
              }),
            },
          },
        },
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(userService).toBeDefined();
  });

  it('should create a user', async () => {
    const createUserDto = { name: 'John Doe', email: 'john@example.com' };

    const result = await userService.createUser(createUserDto);

    expect(result).toEqual({
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
    });
    expect(prismaService.user.create).toHaveBeenCalledWith({
      data: createUserDto,
    });
  });
});
