import { ApiProperty } from '@nestjs/swagger'

export class LoginResponseDto {
  @ApiProperty({
    description: 'JWT access token for API authentication',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
  })
  access_token: string

  @ApiProperty({
    description: 'Token type - always Bearer for JWT',
    example: 'Bearer',
    enum: ['Bearer'],
  })
  token_type: string

  @ApiProperty({
    description: 'Access token expiration time in seconds',
    example: 3600,
    minimum: 1,
  })
  expires_in: number

  @ApiProperty({
    description: 'Space-separated list of scopes granted to the access token',
    example: 'read write',
    required: false,
  })
  scope?: string
}
