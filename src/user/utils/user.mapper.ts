import { plainToClass } from 'class-transformer'
import { UserResponseDto } from '../dto/user-response.dto'
import type { User } from '@prisma/client'

export function toUserResponseDto(user: User): UserResponseDto {
  return plainToClass(UserResponseDto, user, {
    excludeExtraneousValues: false,
  })
}
