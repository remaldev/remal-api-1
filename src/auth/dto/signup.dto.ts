import { ApiProperty } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import {
  IsEmail,
  IsNotEmpty,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator'

export class SignupDto {
  @ApiProperty({
    description: 'User email address',
    example: 'test@remal.dev',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  @MaxLength(100, { message: 'Email must not exceed 100 characters' })
  @Transform(({ value }) => value?.trim().toLowerCase())
  email: string

  @ApiProperty({
    description: 'User password',
    example: 'Password123!',
    minLength: 6,
  })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @MaxLength(100, { message: 'Password must not exceed 100 characters' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&+=])[A-Za-z\d@$!%*?&+=]/,
    {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
    },
  )
  password: string

  @ApiProperty({
    description: 'Preferred language for the user',
    example: 'en',
    enum: ['en', 'ar'],
    default: 'en',
    required: false,
  })
  @Matches(/^(en|ar)$/, {
    message: 'Language must be either "en" (English) or "ar" (Arabic)',
  })
  language: 'en' | 'ar'
}
