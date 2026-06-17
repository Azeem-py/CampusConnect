import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AdminFlagPostDto {
  @ApiPropertyOptional({ example: 'Violates community guidelines' })
  @IsString()
  @IsOptional()
  reason?: string;
}
