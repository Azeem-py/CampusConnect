import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CommunityJoinType } from '@prisma/client';

export class CreateCommunityDto {
  @ApiProperty({ example: 'Computer Science Society' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: 'A community for CS students to share resources and discuss topics' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  banner?: string;

  @ApiPropertyOptional({ enum: CommunityJoinType, default: 'OPEN' })
  @IsOptional()
  @IsEnum(CommunityJoinType)
  joinType?: CommunityJoinType;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isListed?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  institutionId?: string;
}
