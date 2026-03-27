import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthService } from './auth/auth.service';
import { SocialService } from './social/social.service';
import { PostsService } from './posts/posts.service';
import { UsersService } from './users/users.service';

@Module({
  imports: [PrismaModule],
  controllers: [AppController],
  providers: [AuthService, SocialService, PostsService, UsersService],
})
export class AppModule {}
