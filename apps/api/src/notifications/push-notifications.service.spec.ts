import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PushNotificationsService } from './push-notifications.service';
import { PrismaService } from '../prisma/prisma.service';

jest.mock('web-push', () => ({
  setVapidDetails: jest.fn(),
  sendNotification: jest.fn(),
}));

describe('PushNotificationsService', () => {
  const mockPrisma = {
    pushSubscription: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  const makeConfig = (vapidPublic = 'pub_key', vapidPrivate = 'priv_key') => ({
    get: jest.fn((key: string) => {
      if (key === 'VAPID_SUBJECT') return 'mailto:test@test.com';
      if (key === 'VAPID_PUBLIC_KEY') return vapidPublic;
      if (key === 'VAPID_PRIVATE_KEY') return vapidPrivate;
      return undefined;
    }),
  });

  let service: PushNotificationsService;

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('calls setVapidDetails when VAPID keys are configured', async () => {
      const wp = require('web-push');
      await Test.createTestingModule({
        providers: [
          PushNotificationsService,
          { provide: PrismaService, useValue: mockPrisma },
          { provide: ConfigService, useValue: makeConfig() },
        ],
      }).compile();

      expect(wp.setVapidDetails).toHaveBeenCalledWith('mailto:test@test.com', 'pub_key', 'priv_key');
    });

    it('does not call setVapidDetails when VAPID keys are empty', async () => {
      const wp = require('web-push');
      await Test.createTestingModule({
        providers: [
          PushNotificationsService,
          { provide: PrismaService, useValue: mockPrisma },
          { provide: ConfigService, useValue: makeConfig('', '') },
        ],
      }).compile();

      expect(wp.setVapidDetails).not.toHaveBeenCalled();
    });
  });

  describe('instance methods', () => {
    beforeEach(async () => {
      jest.isolateModules(() => {
        // Re-import to get fresh module state
      });
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          PushNotificationsService,
          { provide: PrismaService, useValue: mockPrisma },
          { provide: ConfigService, useValue: makeConfig() },
        ],
      }).compile();

      service = module.get<PushNotificationsService>(PushNotificationsService);
    });

    describe('getVapidPublicKey', () => {
      it('returns the configured public key', () => {
        expect(service.getVapidPublicKey()).toBe('pub_key');
      });
    });

    describe('subscribe', () => {
      const dto = { endpoint: 'https://push.example.com/abc', p256dh: 'key1', auth: 'auth1' };

      it('creates a new subscription when endpoint is new', async () => {
        mockPrisma.pushSubscription.findUnique.mockResolvedValue(null);

        const result = await service.subscribe('user1', dto, 'Mozilla/5.0');

        expect(result).toEqual({ subscribed: true });
        expect(mockPrisma.pushSubscription.create).toHaveBeenCalledWith({
          data: { userId: 'user1', endpoint: dto.endpoint, p256dh: dto.p256dh, auth: dto.auth, userAgent: 'Mozilla/5.0' },
        });
      });

      it('updates userAgent when endpoint exists for same user', async () => {
        mockPrisma.pushSubscription.findUnique.mockResolvedValue({ id: 'sub1', userId: 'user1', endpoint: dto.endpoint });

        const result = await service.subscribe('user1', dto, 'Chrome/120');

        expect(result).toEqual({ subscribed: true });
        expect(mockPrisma.pushSubscription.update).toHaveBeenCalledWith({
          where: { id: 'sub1' },
          data: { userAgent: 'Chrome/120' },
        });
      });

      it('transfers ownership when endpoint exists for a different user', async () => {
        mockPrisma.pushSubscription.findUnique.mockResolvedValue({ id: 'sub1', userId: 'user_old', endpoint: dto.endpoint });

        const result = await service.subscribe('user2', dto, 'Firefox/121');

        expect(result).toEqual({ subscribed: true });
        expect(mockPrisma.pushSubscription.update).toHaveBeenCalledWith({
          where: { id: 'sub1' },
          data: { userId: 'user2', userAgent: 'Firefox/121' },
        });
      });
    });

    describe('unsubscribe', () => {
      it('deletes matching subscriptions', async () => {
        const result = await service.unsubscribe('user1', 'https://push.example.com/abc');

        expect(result).toEqual({ subscribed: false });
        expect(mockPrisma.pushSubscription.deleteMany).toHaveBeenCalledWith({
          where: { userId: 'user1', endpoint: 'https://push.example.com/abc' },
        });
      });
    });

    describe('send', () => {
      const payload = { title: 'Test', body: 'Hello', data: { key: 'val' } };

      it('sends to all subscriptions for user', async () => {
        const wp = require('web-push');
        mockPrisma.pushSubscription.findMany.mockResolvedValue([
          { id: 'sub1', endpoint: 'https://push1.com', p256dh: 'k1', auth: 'a1' },
          { id: 'sub2', endpoint: 'https://push2.com', p256dh: 'k2', auth: 'a2' },
        ]);

        await service.send('user1', payload);

        expect(wp.sendNotification).toHaveBeenCalledTimes(2);
        expect(wp.sendNotification).toHaveBeenCalledWith(
          { endpoint: 'https://push1.com', keys: { p256dh: 'k1', auth: 'a1' } },
          JSON.stringify(payload),
        );
      });

      it('deletes subscription on 410 (expired)', async () => {
        const wp = require('web-push');
        mockPrisma.pushSubscription.findMany.mockResolvedValue([{ id: 'sub1', endpoint: 'e1', p256dh: 'k', auth: 'a' }]);
        const err = new Error('gone');
        (err as any).statusCode = 410;
        wp.sendNotification.mockRejectedValue(err);

        await service.send('user1', payload);

        expect(mockPrisma.pushSubscription.deleteMany).toHaveBeenCalledWith({ where: { id: { in: ['sub1'] } } });
      });

      it('deletes subscription on 404 (not found)', async () => {
        const wp = require('web-push');
        mockPrisma.pushSubscription.findMany.mockResolvedValue([{ id: 'sub1', endpoint: 'e1', p256dh: 'k', auth: 'a' }]);
        const err = new Error('not found');
        (err as any).statusCode = 404;
        wp.sendNotification.mockRejectedValue(err);

        await service.send('user1', payload);

        expect(mockPrisma.pushSubscription.deleteMany).toHaveBeenCalledWith({ where: { id: { in: ['sub1'] } } });
      });

      it('does not delete subscription on non-expired errors', async () => {
        const wp = require('web-push');
        mockPrisma.pushSubscription.findMany.mockResolvedValue([{ id: 'sub1', endpoint: 'e1', p256dh: 'k', auth: 'a' }]);
        const err = new Error('network error');
        (err as any).statusCode = 500;
        wp.sendNotification.mockRejectedValue(err);

        await service.send('user1', payload);

        // deleteMany should not be called since no stale IDs
        expect(mockPrisma.pushSubscription.deleteMany).toHaveBeenCalledTimes(0);
      });

      it('does nothing when user has no subscriptions', async () => {
        const wp = require('web-push');
        mockPrisma.pushSubscription.findMany.mockResolvedValue([]);

        await service.send('user1', payload);

        expect(wp.sendNotification).not.toHaveBeenCalled();
      });
    });
  });
});
