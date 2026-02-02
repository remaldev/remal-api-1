import { ApiProperty } from '@nestjs/swagger'
import { Role } from '@prisma/client'
import { Expose } from 'class-transformer'

export class UserResponseDto {
  @Expose()
  @ApiProperty({
    description: 'Unique identifier',
    example: 'clj1p5mle0000v1337k1337q2',
  })
  id: string

  @Expose()
  @ApiProperty({
    description: 'User email',
    example: 'hi@allali.me',
  })
  email: string

  @Expose()
  @ApiProperty({
    description: 'User username',
    example: 'johndoe',
  })
  username?: string

  @Expose()
  @ApiProperty({
    description: 'User name',
    example: 'John Doe',
  })
  name?: string

  @Expose()
  @ApiProperty({
    description: 'User role',
    example: 'USER',
    enum: Role,
  })
  role: Role

  @Expose()
  @ApiProperty({
    description: 'User verification status',
    example: true,
  })
  isVerified: boolean

  @Expose()
  @ApiProperty({
    description: 'User creation date',
    example: '2026-01-01T00:00:00.000Z',
  })
  createdAt: Date

  @Expose()
  @ApiProperty({
    description: 'User last update date',
    example: '2026-01-01T00:00:00.000Z',
  })
  updatedAt: Date
}
