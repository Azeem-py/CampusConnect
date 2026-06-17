import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { PushNotificationsService } from './push-notifications.service';
import { EmailService } from './email.service';
import { NotificationsGateway } from './notifications.gateway';
import { PrismaService } from '../prisma/prisma.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: any;
  let pushService: any;
  let emailService: any;
  let gateway: any;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
    },
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    notificationPreference: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
      createMany: jest.fn(),
    },
    pushSubscription: {
      count: jest.fn(),
    },
    $transaction: jest.fn((ops: unknown[]) => Promise.all(ops)),
  };

  const mockPushService = {
    send: jest.fn().mockResolvedValue(undefined),
  };

  const mockEmailService = {
    sendNotification: jest.fn().mockResolvedValue(undefined),
  };

  const mockGateway = {
    emitToUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PushNotificationsService, useValue: mockPushService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: NotificationsGateway, useValue: mockGateway },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    prisma = module.get(PrismaService);
    pushService = module.get(PushNotificationsService);
    emailService = module.get(EmailService);
    gateway = module.get(NotificationsGateway);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const dto = {
      recipientId: 'user2',
      type: 'LIKE' as const,
      actorId: 'user1',
      postId: 'post1',
    };

    const mockUser = { emailNotifications: true };
    const mockPref = { inApp: true, push: true };
    const mockNotification = {
      id: 'notif1',
      recipientId: 'user2',
      type: 'LIKE',
      actorId: 'user1',
      postId: 'post1',
      commentId: null,
      metadata: {},
      unread: true,
      createdAt: new Date(),
      actor: { id: 'user1', name: 'User One', username: 'user1', avatar: null },
    };

    function setupMocks(user: unknown = mockUser, pref: unknown = mockPref, pushSubCount = 1) {
      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.notificationPreference.findUnique.mockResolvedValue(pref);
      mockPrisma.pushSubscription.count.mockResolvedValue(pushSubCount);
      mockPrisma.notification.create.mockResolvedValue(mockNotification);
    }

    it('creates notification and sends in-app + push + email when all prefs enabled', async () => {
      setupMocks();

      const result = await service.create(dto);

      expect(prisma.notification.create).toHaveBeenCalled();
      expect(gateway.emitToUser).toHaveBeenCalledWith('user2', 'notification:new', expect.any(Object));
      expect(pushService.send).toHaveBeenCalledWith('user2', expect.objectContaining({ title: 'User One' }));
      expect(emailService.sendNotification).toHaveBeenCalledWith('user2', expect.any(Object));
      expect(result).toMatchObject({ id: 'notif1' });
    });

    it('skips in-app delivery when inApp pref is false', async () => {
      setupMocks(mockUser, { inApp: false, push: true });

      await service.create(dto);

      expect(gateway.emitToUser).not.toHaveBeenCalled();
      expect(pushService.send).toHaveBeenCalled();
    });

    it('skips push when push pref is false', async () => {
      setupMocks(mockUser, { inApp: true, push: false });

      await service.create(dto);

      expect(pushService.send).not.toHaveBeenCalled();
      expect(gateway.emitToUser).toHaveBeenCalled();
    });

    it('skips push when user has no active subscriptions', async () => {
      setupMocks(mockUser, mockPref, 0);

      await service.create(dto);

      expect(pushService.send).not.toHaveBeenCalled();
    });

    it('skips email when user.emailNotifications is false', async () => {
      setupMocks({ ...mockUser, emailNotifications: false }, mockPref);

      await service.create(dto);

      expect(emailService.sendNotification).not.toHaveBeenCalled();
    });

    it('returns null when both inApp and push prefs are disabled', async () => {
      setupMocks(mockUser, { inApp: false, push: false });

      const result = await service.create(dto);

      expect(result).toBeNull();
      expect(prisma.notification.create).not.toHaveBeenCalled();
    });

    it('uses defaults when no preference row exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.notificationPreference.findUnique.mockResolvedValue(null);
      mockPrisma.pushSubscription.count.mockResolvedValue(2);
      mockPrisma.notification.create.mockResolvedValue(mockNotification);

      await service.create(dto);

      expect(gateway.emitToUser).toHaveBeenCalled();
      expect(pushService.send).toHaveBeenCalled();
    });

    it('uses "Someone" as fallback actor name', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.notificationPreference.findUnique.mockResolvedValue(mockPref);
      mockPrisma.notification.create.mockResolvedValue({
        ...mockNotification,
        actor: null,
      });

      await service.create(dto);

      expect(pushService.send).toHaveBeenCalledWith('user2', expect.objectContaining({ title: 'Someone' }));
    });
  });

  describe('findAll', () => {
    it('returns paginated notifications with defaults', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([]);
      mockPrisma.notification.count.mockResolvedValue(0);

      const result = await service.findAll('user1', {});

      expect(result).toMatchObject({ page: 1, limit: 20, total: 0, totalPages: 0 });
      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 20 }),
      );
    });

    it('applies type filter', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([]);
      mockPrisma.notification.count.mockResolvedValue(0);

      await service.findAll('user1', { type: 'MENTION' });

      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: 'MENTION' }),
        }),
      );
    });

    it('applies unread filter', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([]);
      mockPrisma.notification.count.mockResolvedValue(0);

      await service.findAll('user1', { unread: true });

      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ unread: true }),
        }),
      );
    });

    it('clamps page and limit to safe ranges', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([]);
      mockPrisma.notification.count.mockResolvedValue(0);

      await service.findAll('user1', { page: 0, limit: 999 });

      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 100 }),
      );
    });
  });

  describe('getUnreadCount', () => {
    it('returns unread count from database', async () => {
      mockPrisma.notification.count.mockResolvedValue(5);

      const result = await service.getUnreadCount('user1');

      expect(result).toEqual({ count: 5 });
      expect(prisma.notification.count).toHaveBeenCalledWith(
        expect.objectContaining({ where: { recipientId: 'user1', unread: true } }),
      );
    });
  });

  describe('markAsRead', () => {
    it('marks notification as read', async () => {
      mockPrisma.notification.findFirst.mockResolvedValue({ id: 'notif1' });
      mockPrisma.notification.update.mockResolvedValue({
        id: 'notif1',
        unread: false,
        createdAt: new Date(),
        actor: null,
      });

      const result = await service.markAsRead('user1', 'notif1');

      expect(result.unread).toBe(false);
      expect(prisma.notification.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'notif1' }, data: { unread: false } }),
      );
    });

    it('throws NotFoundException when notification not found', async () => {
      mockPrisma.notification.findFirst.mockResolvedValue(null);

      await expect(service.markAsRead('user1', 'nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('markAllAsRead', () => {
    it('marks all notifications as read for user', async () => {
      const result = await service.markAllAsRead('user1');

      expect(result).toEqual({ success: true });
      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { recipientId: 'user1', unread: true },
        data: { unread: false },
      });
    });
  });

  describe('delete', () => {
    it('deletes a notification', async () => {
      mockPrisma.notification.findFirst.mockResolvedValue({ id: 'notif1' });

      const result = await service.delete('user1', 'notif1');

      expect(result).toEqual({ success: true });
      expect(prisma.notification.delete).toHaveBeenCalledWith({ where: { id: 'notif1' } });
    });

    it('throws NotFoundException when notification not found', async () => {
      mockPrisma.notification.findFirst.mockResolvedValue(null);

      await expect(service.delete('user1', 'nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPreferences', () => {
    it('returns mapped preferences', async () => {
      mockPrisma.notificationPreference.findMany.mockResolvedValue([
        { type: 'LIKE', inApp: true, push: true },
        { type: 'MENTION', inApp: false, push: true },
      ]);

      const result = await service.getPreferences('user1');

      expect(result).toEqual([
        { type: 'LIKE', inApp: true, push: true },
        { type: 'MENTION', inApp: false, push: true },
      ]);
    });
  });

  describe('updatePreference', () => {
    it('upserts a preference', async () => {
      const result = await service.updatePreference('user1', { type: 'LIKE', inApp: false });

      expect(result).toEqual({ success: true });
      expect(prisma.notificationPreference.upsert).toHaveBeenCalled();
    });
  });

  describe('bulkUpdatePreferences', () => {
    it('upserts multiple preferences in a transaction', async () => {
      const prefs = [
        { type: 'LIKE' as const, inApp: true, push: false },
        { type: 'MENTION' as const, inApp: true, push: true },
      ];

      const result = await service.bulkUpdatePreferences('user1', prefs);

      expect(result).toEqual({ success: true });
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });
  });

  describe('seedDefaultPreferences', () => {
    it('creates missing preferences only', async () => {
      mockPrisma.notificationPreference.findMany.mockResolvedValue([
        { type: 'LIKE' },
        { type: 'MENTION' },
      ]);

      await service.seedDefaultPreferences('user1');

      expect(prisma.notificationPreference.createMany).toHaveBeenCalled();
      const call = (prisma.notificationPreference.createMany as jest.Mock).mock.calls[0][0];
      // 8 total types - 2 existing = 6 to create
      expect(call.data).toHaveLength(6);
    });

    it('does nothing when all preferences already exist', async () => {
      const allTypes = ['MENTION', 'LIKE', 'LIKE_COMMENT', 'COMMENT', 'REPLY', 'REPOST', 'FOLLOW', 'SYSTEM'];
      mockPrisma.notificationPreference.findMany.mockResolvedValue(
        allTypes.map((t) => ({ type: t })),
      );

      await service.seedDefaultPreferences('user1');

      expect(prisma.notificationPreference.createMany).not.toHaveBeenCalled();
    });
  });
});
