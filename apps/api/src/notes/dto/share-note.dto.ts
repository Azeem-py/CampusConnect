import { IsString, IsArray, IsIn, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ShareNoteDto {
  @ApiProperty({ description: 'Array of user IDs to share with' })
  @IsArray()
  @ArrayMinSize(1)
  userIds!: string[];

  @ApiProperty({ enum: ['READ', 'WRITE'], default: 'READ', description: 'Permission level' })
  @IsString()
  @IsIn(['READ', 'WRITE'])
  permission!: string;
}
