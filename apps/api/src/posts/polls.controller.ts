import {
  Controller,
  Post,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PostsService } from './posts.service';
import { PollVoteDto } from './dto';

@ApiTags('Polls')
@Controller('api/v1/polls')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PollsController {
  constructor(private postsService: PostsService) {}

  @Post(':id/vote')
  @ApiOperation({ summary: 'Vote on a poll option (toggle if same option)' })
  async vote(@Param('id') pollId: string, @Body() dto: PollVoteDto, @Req() req: Request) {
    const userId = (req as any).user.id;
    return this.postsService.votePoll(pollId, userId, dto.pollOptionId);
  }
}
