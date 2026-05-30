import { Controller, Post, Get, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SocialService } from './social.service';
import { TrendingService } from './trending.service';
import { VoteDto } from './dto/vote.dto';

@ApiTags('Social')
@Controller('api/v1/social')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SocialController {
  constructor(
    private readonly socialService: SocialService,
    private readonly trendingService: TrendingService,
  ) {}

  @Post('vote')
  @ApiOperation({ summary: 'Cast or update a vote on a post or comment' })
  async vote(@Body() dto: VoteDto, @Req() req: Request) {
    const userId = (req as any).user.id;
    return this.socialService.vote(userId, dto);
  }

  @Get('trending')
  @ApiOperation({ summary: 'Retrieve statistical, time-decayed trending topics and hashtags' })
  async getTrending() {
    return this.trendingService.getTrendingTopics();
  }
}
