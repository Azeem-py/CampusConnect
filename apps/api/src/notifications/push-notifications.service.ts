import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';
import { PrismaService } from '../prisma/prisma.service';
import type { SubscribePushDto } from './dto/notifications.dto';

@Injectable()
export class PushNotificationsService {
  private readonly logger = new Logger(PushNotificationsService.name);
  private readonly vapidSubject: string;
  private readonly vapidPublicKey: string;
  private readonly vapidPrivateKey: string;
  private webPushReady = false;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.vapidSubject = this.config.get('VAPID_SUBJECT') ?? 'mailto:notifications@campusconnect.app';
    this.vapidPublicKey = this.config.get('VAPID_PUBLIC_KEY') ?? '';
    this.vapidPrivateKey = this.config.get('VAPID_PRIVATE_KEY') ?? '';

    if (this.vapidPublicKey && this.vapidPrivateKey) {
      try {
        webpush.setVapidDetails(this.vapidSubject, this.vapidPublicKey, this.vapidPrivateKey);
        this.webPushReady = true;
      } catch {
        this.logger.warn('web-push initialization failed, push notifications disabled');
      }
    } else {
      this.logger.warn('VAPID keys not configured, push notifications disabled');
    }
  }

  getVapidPublicKey(): string {
    return this.vapidPublicKey;
  }

  async subscribe(userId: string, dto: SubscribePushDto, userAgent?: string) {
    const existing = await this.prisma.pushSubscription.findUnique({
      where: { endpoint: dto.endpoint },
    });

    if (existing) {
      if (existing.userId !== userId) {
        await this.prisma.pushSubscription.update({
          where: { id: existing.id },
          data: { userId, userAgent },
        });
      } else {
        await this.prisma.pushSubscription.update({
          where: { id: existing.id },
          data: { userAgent },
        });
      }
      return { subscribed: true };
    }

    await this.prisma.pushSubscription.create({
      data: {
        userId,
        endpoint: dto.endpoint,
        p256dh: dto.p256dh,
        auth: dto.auth,
        userAgent,
      },
    });
    return { subscribed: true };
  }

  async unsubscribe(userId: string, endpoint: string) {
    await this.prisma.pushSubscription.deleteMany({
      where: { userId, endpoint },
    });
    return { subscribed: false };
  }

  async send(userId: string, payload: { title: string; body: string; data?: Record<string, unknown> }) {
    if (!this.webPushReady) return;

    const subs = await this.prisma.pushSubscription.findMany({
      where: { userId },
    });

    if (subs.length === 0) return;

    const body = JSON.stringify(payload);

    const results = await Promise.allSettled(
      subs.map((sub) =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          body,
        ),
      ),
    );

    // Clean up stale subscriptions and log errors concurrently
    const staleIds: string[] = [];

    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const err = result.reason as { statusCode?: number; message?: string };
        if (err.statusCode === 410 || err.statusCode === 404) {
          staleIds.push(subs[index].id);
        } else {
          this.logger.error(`Push send failed for ${subs[index].id}: ${err.message ?? 'Unknown error'}`);
        }
      }
    });

    if (staleIds.length > 0) {
      await this.prisma.pushSubscription.deleteMany({
        where: { id: { in: staleIds } },
      });
    }
  }
}
