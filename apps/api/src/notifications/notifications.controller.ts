import {
  Controller,
  Get,
  Patch,
  Delete,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCookieAuth, ApiQuery } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationsService } from './notifications.service';
import { PushNotificationsService } from './push-notifications.service';
import {
  NotificationFilterDto,
  UpdatePreferencesDto,
  BulkUpdatePreferencesDto,
  SubscribePushDto,
} from './dto/notifications.dto';

@ApiTags('Notifications')
@Controller('api/v1/notifications')
export class NotificationsController {
  constructor(
    private notificationsService: NotificationsService,
    private pushService: PushNotificationsService,
  ) {}

  @Get('vapid-public-key')
  @ApiOperation({ summary: 'Get VAPID public key for push subscription' })
  getVapidPublicKey() {
    return { publicKey: this.pushService.getVapidPublicKey() };
  }
}

@Controller('api/v1/notifications')
@UseGuards(JwtAuthGuard)
@ApiCookieAuth('token')
export class NotificationsAuthController {
  constructor(
    private notificationsService: NotificationsService,
    private pushService: PushNotificationsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get paginated notifications for current user' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'unread', required: false })
  async findAll(@Req() req: Request, @Query() filters: NotificationFilterDto) {
    const userId = (req as any).user.id;
    return this.notificationsService.findAll(userId, filters);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  async getUnreadCount(@Req() req: Request) {
    const userId = (req as any).user.id;
    return this.notificationsService.getUnreadCount(userId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  async markAsRead(@Param('id') id: string, @Req() req: Request) {
    const userId = (req as any).user.id;
    return this.notificationsService.markAsRead(userId, id);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@Req() req: Request) {
    const userId = (req as any).user.id;
    return this.notificationsService.markAllAsRead(userId);
  }

  @Delete('push-subscribe')
  @ApiOperation({ summary: 'Unsubscribe from push notifications' })
  async unsubscribePush(@Req() req: Request, @Query('endpoint') endpoint: string) {
    const userId = (req as any).user.id;
    return this.pushService.unsubscribe(userId, endpoint);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  async delete(@Param('id') id: string, @Req() req: Request) {
    const userId = (req as any).user.id;
    return this.notificationsService.delete(userId, id);
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Get notification preferences for current user' })
  async getPreferences(@Req() req: Request) {
    const userId = (req as any).user.id;
    return this.notificationsService.getPreferences(userId);
  }

  @Patch('preferences')
  @ApiOperation({ summary: 'Update notification preference for a type' })
  async updatePreference(@Req() req: Request, @Body() dto: UpdatePreferencesDto) {
    const userId = (req as any).user.id;
    return this.notificationsService.updatePreference(userId, dto);
  }

  @Patch('preferences/bulk')
  @ApiOperation({ summary: 'Bulk update notification preferences' })
  async bulkUpdatePreferences(@Req() req: Request, @Body() dto: BulkUpdatePreferencesDto) {
    const userId = (req as any).user.id;
    return this.notificationsService.bulkUpdatePreferences(userId, dto.preferences);
  }

  @Post('push-subscribe')
  @ApiOperation({ summary: 'Subscribe to push notifications' })
  async subscribePush(
    @Req() req: Request,
    @Body() dto: SubscribePushDto,
    @Headers('user-agent') userAgent?: string,
  ) {
    const userId = (req as any).user.id;
    return this.pushService.subscribe(userId, dto, userAgent);
  }
}
