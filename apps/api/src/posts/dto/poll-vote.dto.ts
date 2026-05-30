import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PollVoteDto {
  @ApiProperty({ example: 'clx...pollOptionId...' })
  @IsString()
  pollOptionId!: string;
}
