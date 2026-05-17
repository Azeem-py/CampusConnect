import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { LoggerModule } from './common/logger/logger.module';
import { RequestLoggerMiddleware } from './common/logger/request-logger.middleware';
import { SocialService } from './social/social.service';
import { PostsService } from './posts/posts.service';

@Module({
  imports: [ConfigModule.forRoot(), PrismaModule, AuthModule, UsersModule, LoggerModule],
  controllers: [AppController],
  providers: [SocialService, PostsService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
