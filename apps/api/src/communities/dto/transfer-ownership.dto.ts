import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TransferOwnershipDto {
  @ApiProperty()
  @IsString()
  targetUserId!: string;
}
