import { ApiHideProperty, ApiProperty, OmitType } from '@nestjs/swagger'
import { CreateUserDto } from './create-user.dto'
import { Exclude } from 'class-transformer'

export class UserResponseDto extends OmitType(CreateUserDto, ['password']) {
  @ApiProperty({
    description: 'Unique identifier',
    example: 'clj1p5mle0000v1337k1337q2',
  })
  id: string

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

  @Exclude()
  @ApiHideProperty()
  password: string
}
