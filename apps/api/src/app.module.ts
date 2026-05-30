import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { LoggerModule } from './common/logger/logger.module';
import { SocialService } from './social/social.service';
import { PostsModule } from './posts/posts.module';
import { RecommendationsModule } from './recommendations/recommendations.module';

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
  ],
  controllers: [AppController],
  providers: [SocialService],
})
export class AppModule {}

