import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from './notifications.service';
import type { CreateNotificationDto } from './dto/notifications.dto';

export const NOTIFICATION_EVENT = 'notification.create';

@Injectable()
export class NotificationListener {
  constructor(private notificationsService: NotificationsService) {}

  @OnEvent(NOTIFICATION_EVENT)
  async handleNotificationCreate(payload: CreateNotificationDto) {
    await this.notificationsService.create(payload);
  }
}
