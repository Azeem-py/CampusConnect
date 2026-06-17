import { IsString, IsBoolean, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBannedWordDto {
  @ApiProperty({ example: 'spam' })
  @IsString()
  @IsNotEmpty()
  pattern!: string;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isRegex?: boolean;
}
