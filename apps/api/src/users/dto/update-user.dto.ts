import {
  IsString,
  IsOptional,
  IsNumber,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UpdateProfileDto } from '@campus-connect/types';

export class UpdateUserDto implements UpdateProfileDto {
  @ApiProperty({
    example: 'Alex Rivera',
    description: 'Updated name of the user',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    example: '@alex_rivera',
    description: 'Updated username for the user',
    required: false,
  })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty({
    example: 'Passionate about coding, AI, and campus life.',
    description: 'User biography',
    required: false,
  })
  @IsOptional()
  @IsString()
  bio?: string | null;

  @ApiProperty({
    example: '+1 (555) 123-4567',
    description: 'Phone number',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string | null;

  @ApiProperty({
    example: 'comp-sci',
    description: 'Department or field of study',
    required: false,
  })
  @IsOptional()
  @IsString()
  department?: string | null;

  @ApiProperty({
    example: 'mit',
    description: 'Institution / school name',
    required: false,
  })
  @IsOptional()
  @IsString()
  school?: string | null;

  @ApiProperty({
    example: 'Computer Science & Engineering',
    description: 'Major of the student',
    required: false,
  })
  @IsOptional()
  @IsString()
  major?: string | null;

  @ApiProperty({
    example: 2026,
    description: 'Graduation year',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  graduationYear?: number | null;

  @ApiProperty({
    example: 'Machine Learning, Quantum Physics',
    description: 'Comma-separated list of interests',
    required: false,
  })
  @IsOptional()
  @IsString()
  interests?: string | null;

  @ApiProperty({
    example: 'Photography',
    description: 'Favorite hobby',
    required: false,
  })
  @IsOptional()
  @IsString()
  hobby?: string | null;

  @ApiProperty({
    example: 'data:image/png;base64,...',
    description: 'Base64-encoded avatar image or image URL',
    required: false,
  })
  @IsOptional()
  @IsString()
  avatar?: string | null;

  @ApiProperty({
    example: 'data:image/png;base64,...',
    description: 'Base64-encoded banner image or image URL',
    required: false,
  })
  @IsOptional()
  @IsString()
  banner?: string | null;
}
