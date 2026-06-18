import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
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
import { InstitutionsModule } from './institutions/institutions.module';
import { CommunitiesModule } from './communities/communities.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AdminModule } from './admin/admin.module';
import { ThrottlerBehindProxyGuard } from './common/guards/throttler-behind-proxy.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot({ global: true }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 3,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 20,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100,
      },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    LoggerModule,
    PostsModule,
    NotificationsModule,
    RecommendationsModule,
    ModerationModule,
    InstitutionsModule,
    CommunitiesModule,
    AdminModule,
  ],
  controllers: [AppController, SocialController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerBehindProxyGuard,
    },
    SocialService,
    TrendingService,
  ],
})
export class AppModule {}

