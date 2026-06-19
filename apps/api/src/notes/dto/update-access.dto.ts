import { IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAccessDto {
  @ApiProperty({ enum: ['READ', 'WRITE'] })
  @IsString()
  @IsIn(['READ', 'WRITE'])
  permission!: string;
}
