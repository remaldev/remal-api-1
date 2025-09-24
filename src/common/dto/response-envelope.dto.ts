import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class SuccessEnvelopeDto<T = unknown> {
  @ApiProperty({ example: true })
  success: true

  @ApiPropertyOptional({ example: 'Operation successful', nullable: true })
  message?: string

  @ApiProperty({ description: 'Wrapped successful response payload' })
  // eslint-disable-next-line @typescript-eslint/ban-types
  data: T
}

export class ErrorEnvelopeDto {
  @ApiProperty({ example: false })
  success: false

  @ApiProperty({ example: 400 })
  statusCode: number

  @ApiProperty({
    oneOf: [
      { type: 'string', example: 'Invalid credentials' },
      {
        type: 'array',
        items: { type: 'string' },
        example: ['Email is required'],
      },
    ],
  })
  message: string | string[]

  @ApiProperty({ example: 'Bad Request' })
  error: string

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  timestamp: string

  @ApiProperty({ example: '/auth/login' })
  path: string
}
