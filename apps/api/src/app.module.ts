import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { LoggerModule } from './common/logger/logger.module';
import { SocialService } from './social/social.service';
import { TrendingService } from './social/trending.service';
import { SocialController } from './social/social.controller';
import { PostsModule } from './posts/posts.module';
import { RecommendationsModule } from './recommendations/recommendations.module';
import { ModerationModule } from './moderation/moderation.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ScheduleModule.forRoot(), // FIX M4: single global scheduler instance
    PrismaModule,
    AuthModule,
    UsersModule,
    LoggerModule,
    PostsModule,
    RecommendationsModule,
    ModerationModule,
  ],
  controllers: [AppController, SocialController],
  providers: [SocialService, TrendingService],
})
export class AppModule {}

