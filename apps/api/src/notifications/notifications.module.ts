import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsController, NotificationsAuthController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { PushNotificationsService } from './push-notifications.service';
import { EmailService } from './email.service';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationListener } from './notification-listener.service';

@Module({
  imports: [PrismaModule, forwardRef(() => AuthModule)],
  controllers: [NotificationsController, NotificationsAuthController],
  providers: [NotificationsService, PushNotificationsService, EmailService, NotificationsGateway, NotificationListener],
  exports: [NotificationsService],
})
export class NotificationsModule {}
