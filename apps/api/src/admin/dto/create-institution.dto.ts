import { IsString, IsOptional, IsEnum, IsNotEmpty } from 'class-validator';
import { InstitutionType } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInstitutionDto {
  @ApiProperty({ example: 'University of Lagos' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ enum: InstitutionType, example: 'UNIVERSITY' })
  @IsEnum(InstitutionType)
  @IsNotEmpty()
  type!: InstitutionType;

  @ApiPropertyOptional({ example: 'Lagos' })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ example: 'UNILAG' })
  @IsString()
  @IsOptional()
  acronym?: string;
}
