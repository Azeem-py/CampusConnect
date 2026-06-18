import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PushNotificationsService } from './push-notifications.service';
import { EmailService } from './email.service';
import { NotificationsGateway } from './notifications.gateway';
import type {
  CreateNotificationDto,
  NotificationFilterDto,
  NotificationResponse,
  UpdatePreferencesDto,
  NotificationTypeApi,
} from './dto/notifications.dto';

const notificationInclude = {
  actor: { select: { id: true, name: true, username: true, avatar: true } },
} as const;

type NotificationWithActor = Prisma.NotificationGetPayload<{ include: typeof notificationInclude }>;

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private pushService: PushNotificationsService,
    private emailService: EmailService,
    private gateway: NotificationsGateway,
  ) {}

  async create(data: CreateNotificationDto) {
    const [user, prefs, pushSubCount] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: data.recipientId },
        select: { emailNotifications: true },
      }),
      this.prisma.notificationPreference.findUnique({
        where: {
          userId_type: { userId: data.recipientId, type: data.type as any },
        },
      }),
      this.prisma.pushSubscription.count({
        where: { userId: data.recipientId },
      }),
    ]);

    const inApp = prefs?.inApp ?? true;
    // Push is enabled only if the user has active browser subscriptions AND per-type pref allows it
    const push = pushSubCount > 0 && (prefs?.push ?? true);

    if (!inApp && !push) return null;

    const notification = await this.prisma.notification.create({
      data: {
        recipientId: data.recipientId,
        type: data.type as any,
        actorId: data.actorId,
        postId: data.postId,
        commentId: data.commentId,
        metadata: (data.metadata ?? {}) as Prisma.InputJsonValue,
      },
      include: notificationInclude,
    });

    if (inApp) {
      this.gateway.emitToUser(data.recipientId, 'notification:new', this.toResponse(notification));
    }

    if (push) {
      const actorName = notification.actor?.name ?? 'Someone';
      const typeLabel = this.formatTypeLabel(data.type);
      this.pushService
        .send(data.recipientId, {
          title: actorName,
          body: typeLabel,
          data: { notificationId: notification.id, type: data.type, postId: data.postId },
        })
        .catch((err) => this.logger.error(`Push notification failed: ${err.message}`));
    }

    if (user?.emailNotifications !== false) {
      const actorName = notification.actor?.name ?? 'Someone';
      const typeLabel = this.formatTypeLabel(data.type);
      this.emailService
        .sendNotification(data.recipientId, {
          subject: `Logos - ${actorName} ${typeLabel}`,
          text: `${actorName} ${typeLabel} on Logos.`,
        })
        .catch((err) => this.logger.error(`Email notification failed: ${err.message}`));
    }

    return this.toResponse(notification);
  }

  async findAll(userId: string, filters: NotificationFilterDto) {
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filters.limit) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = { recipientId: userId };
    if (filters.type) where.type = filters.type as any;
    if (filters.unread !== undefined) where.unread = filters.unread;

    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        include: notificationInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      notifications: items.map((n) => this.toResponse(n)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { recipientId: userId, unread: true },
    });
    return { count };
  }

  async markAsRead(userId: string, id: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, recipientId: userId },
    });
    if (!notification) throw new NotFoundException('Notification not found');

    const updated = await this.prisma.notification.update({
      where: { id },
      data: { unread: false },
      include: notificationInclude,
    });

    return this.toResponse(updated);
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { recipientId: userId, unread: true },
      data: { unread: false },
    });
    return { success: true };
  }

  async delete(userId: string, id: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, recipientId: userId },
    });
    if (!notification) throw new NotFoundException('Notification not found');

    await this.prisma.notification.delete({ where: { id } });
    return { success: true };
  }

  async getPreferences(userId: string) {
    const prefs = await this.prisma.notificationPreference.findMany({
      where: { userId },
    });
    return prefs.map((p) => ({
      type: p.type,
      inApp: p.inApp,
      push: p.push,
    }));
  }

  async updatePreference(userId: string, dto: UpdatePreferencesDto) {
    await this.prisma.notificationPreference.upsert({
      where: {
        userId_type: { userId, type: dto.type as any },
      },
      create: {
        userId,
        type: dto.type as any,
        inApp: dto.inApp ?? true,
        push: dto.push ?? true,
      },
      update: {
        inApp: dto.inApp,
        push: dto.push,
      },
    });
    return { success: true };
  }

  async bulkUpdatePreferences(userId: string, preferences: UpdatePreferencesDto[]) {
    await this.prisma.$transaction(
      preferences.map((pref) =>
        this.prisma.notificationPreference.upsert({
          where: {
            userId_type: { userId, type: pref.type as any },
          },
          create: {
            userId,
            type: pref.type as any,
            inApp: pref.inApp ?? true,
            push: pref.push ?? true,
          },
          update: {
            inApp: pref.inApp,
            push: pref.push,
          },
        }),
      ),
    );
    return { success: true };
  }

  async seedDefaultPreferences(userId: string) {
    const types: NotificationTypeApi[] = [
      'MENTION', 'LIKE', 'LIKE_COMMENT', 'COMMENT', 'REPLY', 'REPOST', 'FOLLOW', 'SYSTEM',
    ];
    const existing = await this.prisma.notificationPreference.findMany({
      where: { userId },
      select: { type: true },
    });
    const existingTypes = new Set(existing.map((e) => e.type));

    const toCreate = types
      .filter((t) => !existingTypes.has(t as any))
      .map((type) => ({
        userId,
        type: type as any,
        inApp: true,
        push: true,
      }));

    if (toCreate.length > 0) {
      await this.prisma.notificationPreference.createMany({ data: toCreate });
    }
  }

  private toResponse(n: NotificationWithActor): NotificationResponse {
    return {
      id: n.id,
      type: n.type as NotificationTypeApi,
      actorId: n.actorId,
      actor: n.actor,
      postId: n.postId,
      commentId: n.commentId,
      metadata: n.metadata as Record<string, unknown> | null,
      unread: n.unread,
      createdAt: n.createdAt.toISOString(),
    };
  }

  private formatTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      MENTION: 'mentioned you',
      LIKE: 'liked your post',
      LIKE_COMMENT: 'liked your comment',
      COMMENT: 'commented on your post',
      REPLY: 'replied to your comment',
      REPOST: 'reposted your post',
      FOLLOW: 'followed you',
      SYSTEM: 'sent a system notification',
    };
    return labels[type] ?? 'interacted with you';
  }
}
