import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller';
import { PollsController } from './polls.controller';
import { EventsController } from './events.controller';
import { PostsService } from './posts.service';
import { RecommendationsModule } from '../recommendations/recommendations.module';

@Module({
  imports: [RecommendationsModule],
  controllers: [PostsController, PollsController, EventsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
