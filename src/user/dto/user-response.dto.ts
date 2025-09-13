import { ApiProperty } from '@nestjs/swagger'
import { Role } from '@prisma/client'

export class UserResponseDto {
  @ApiProperty({
    description: 'Unique identifier',
    example: 'clj1p5mle0000v1337k1337q2',
  })
  id: string
  @ApiProperty({
    description: 'User email',
    example: 'hi@allali.me',
  })
  email: string

  @ApiProperty({
    description: 'User username',
    example: 'johndoe',
  })
  username?: string

  @ApiProperty({
    description: 'User name',
    example: 'John Doe',
  })
  name?: string

  @ApiProperty({
    description: 'User role',
    example: 'USER',
    enum: Role,
  })
  role: Role

  @ApiProperty({
    description: 'User verification status',
    example: true,
  })
  isVerified: boolean

  @ApiProperty({
    description: 'User creation date',
    example: '2026-01-01T00:00:00.000Z',
  })
  createdAt: Date

  @ApiProperty({
    description: 'User last update date',
    example: '2026-01-01T00:00:00.000Z',
  })
  updatedAt: Date
}
