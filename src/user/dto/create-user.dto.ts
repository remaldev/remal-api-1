import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsAlphanumeric,
} from 'class-validator'
import { Transform } from 'class-transformer'

export class CreateUserDto {
  @ApiProperty({
    description: 'User email address',
    example: 'test@remal.dev',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  @MaxLength(100, { message: 'Email must not exceed 100 characters' })
  @Transform(({ value }) => value?.trim())
  email: string

  @ApiPropertyOptional({
    description: 'User username',
    example: 'aallali',
  })
  @IsOptional()
  @IsString()
  @IsAlphanumeric(undefined, {
    message: 'Username must contain only alphanumeric characters',
  })
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  @MaxLength(30, { message: 'Username must not exceed 30 characters' })
  @Transform(({ value }) => value?.trim())
  username?: string

  @ApiPropertyOptional({
    description: 'User last name',
    example: 'Allali',
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Last name must be at least 2 characters long' })
  @MaxLength(50, { message: 'Last name must not exceed 50 characters' })
  @Matches(/^[a-zA-Z\s\-']+$/, {
    message:
      'Last name can only contain letters, spaces, hyphens and apostrophes',
  })
  @Transform(({ value }) => value?.trim())
  name?: string

  @ApiPropertyOptional({
    description: 'User first name',
    example: 'Abdellah',
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'First name must be at least 2 characters long' })
  @MaxLength(50, { message: 'First name must not exceed 50 characters' })
  @Matches(/^[a-zA-Z\s\-']+$/, {
    message:
      'First name can only contain letters, spaces, hyphens and apostrophes',
  })
  @Transform(({ value }) => value?.trim())
  firstname?: string

  @ApiProperty({
    description: 'User password',
    example: 'Password123!',
    minLength: 6,
  })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @MaxLength(100, { message: 'Password must not exceed 100 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
  })
  password: string
}
