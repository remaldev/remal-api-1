import type { User } from '@prisma/client'
import { plainToClass } from 'class-transformer'
import { UserResponseDto } from '../dto/user-response.dto'

export function toUserResponseDto(
  user: Omit<User, 'password'>,
): UserResponseDto {
  return plainToClass(UserResponseDto, user, {
    excludeExtraneousValues: true,
  })
}
