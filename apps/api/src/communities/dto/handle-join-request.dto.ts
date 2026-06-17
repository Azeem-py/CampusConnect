import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class HandleJoinRequestDto {
  @ApiProperty({ enum: ['APPROVED', 'DECLINED'] })
  @IsEnum(['APPROVED', 'DECLINED'] as const)
  status!: 'APPROVED' | 'DECLINED';
}
