import {
  IsEmail,
  IsString,
  IsNotEmpty,
  IsOptional,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Match } from '../../common/decorators/match.decorator';

export class SignupDto {
  @ApiProperty({
    example: 'Alex Rivera',
    description: 'Full name of the user',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    example: '@alex_rivera',
    description: 'Unique username for the user',
  })
  @IsString()
  @IsNotEmpty()
  username!: string;

  @ApiProperty({
    example: 'alex@institution.edu',
    description: 'Email address (preferably institutional)',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    example: '+1 (555) 123-4567',
    description: 'Phone number',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    example: 'comp-sci',
    description: 'Department or field of study',
    required: false,
  })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiProperty({
    example: 'mit',
    description: 'Institution / school name',
    required: false,
  })
  @IsOptional()
  @IsString()
  school?: string;

  @ApiProperty({
    example: 'Machine Learning, Quantum Physics',
    description: 'Comma-separated list of interests',
    required: false,
  })
  @IsOptional()
  @IsString()
  interests?: string;

  @ApiProperty({
    example: 'Photography',
    description: 'Favorite hobby',
    required: false,
  })
  @IsOptional()
  @IsString()
  hobby?: string;

  @ApiProperty({
    example: 'secureP@ss123',
    description: 'Password (minimum 6 characters)',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password!: string;

  @ApiProperty({
    example: 'secureP@ss123',
    description: 'Confirm password — must match password',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @Match('password', { message: 'Passwords do not match' })
  confirmPassword!: string;

  @ApiProperty({
    example: 'data:image/png;base64,...',
    description: 'Base64-encoded avatar image',
    required: false,
  })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({
    example: 'data:image/png;base64,...',
    description: 'Base64-encoded banner image',
    required: false,
  })
  @IsOptional()
  @IsString()
  banner?: string;
}
