import { IsString, IsOptional, IsInt, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VoteDto {
  @ApiPropertyOptional({ example: 'post123' })
  @IsOptional()
  @IsString()
  postId?: string;

  @ApiPropertyOptional({ example: 'comment123' })
  @IsOptional()
  @IsString()
  commentId?: string;

  @ApiProperty({ example: 1, description: '1 for upvote, -1 for downvote, 0 to retract' })
  @IsInt()
  @IsIn([1, -1, 0])
  value!: 1 | -1 | 0;
}
