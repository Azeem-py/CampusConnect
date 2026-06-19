import { IsString, IsOptional, IsBoolean, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNoteDto {
  @ApiPropertyOptional({ example: 'My Study Notes', description: 'Optional note title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ example: 'This is my personal note content...', description: 'Note content' })
  @IsString()
  content!: string;

  @ApiPropertyOptional({ description: 'Array of image URLs' })
  @IsOptional()
  @IsArray()
  images?: string[];

  @ApiPropertyOptional({ default: false, description: 'Whether the note is publicly visible' })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
