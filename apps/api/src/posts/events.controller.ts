import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PostsService } from './posts.service';

@ApiTags('Events')
@Controller('api/v1/events')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EventsController {
  constructor(private postsService: PostsService) {}

  @Get()
  @ApiOperation({ summary: 'List upcoming events' })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  async findUpcoming(@Query('limit') limit?: string) {
    return this.postsService.findUpcomingEvents(Number(limit) || 10);
  }
}
