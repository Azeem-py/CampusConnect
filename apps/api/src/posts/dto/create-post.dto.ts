import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class EventDto {
  @ApiProperty({ example: 'Data Science Symposium' })
  @IsString()
  title!: string;

  @ApiProperty({ example: '2026-06-15' })
  @IsString()
  date!: string;

  @ApiPropertyOptional({ example: '14:00' })
  @IsOptional()
  @IsString()
  time?: string;

  @ApiPropertyOptional({ example: 'Student Union · Room 201' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: 'A symposium on data science topics...' })
  @IsOptional()
  @IsString()
  description?: string;
}

class PollDto {
  @ApiProperty({ example: 'Which research topic interests you most?' })
  @IsString()
  question!: string;

  @ApiProperty({ example: ['Machine Learning', 'Quantum Computing', 'AI Ethics'] })
  @IsArray()
  @IsString({ each: true })
  @MinLength(1, { each: true })
  options!: string[];
}

export class CreatePostDto {
  @ApiPropertyOptional({ example: 'My Post Title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ example: 'This is the post content...' })
  @IsString()
  content!: string;

  @ApiPropertyOptional({ enum: ['DRAFT', 'PUBLISHED'], default: 'DRAFT' })
  @IsOptional()
  @IsEnum(['DRAFT', 'PUBLISHED'] as const)
  status?: 'DRAFT' | 'PUBLISHED';

  @ApiPropertyOptional({ example: 'CS-412' })
  @IsOptional()
  @IsString()
  courseCode?: string;

  @ApiPropertyOptional({ type: [String], example: ['data:image/png;base64,...'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ type: EventDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => EventDto)
  event?: EventDto;

  @ApiPropertyOptional({ type: PollDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PollDto)
  poll?: PollDto;

  @ApiPropertyOptional({ type: [String], example: ['ai', 'nextjs'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
