import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';
import { PrismaService } from '../prisma/prisma.service';

const mockTransporter = {
  sendMail: jest.fn().mockResolvedValue({ accepted: ['user@test.com'] }),
};

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => mockTransporter),
}));

describe('EmailService', () => {
  const mockPrisma = {
    user: { findUnique: jest.fn() },
  };

  const makeConfig = (
    host = 'smtp.test.com',
    port = '587',
    user = 'smtp_user',
    pass = 'smtp_pass',
    from = 'noreply@test.com',
  ) => ({
    get: jest.fn((key: string) => {
      if (key === 'SMTP_HOST') return host;
      if (key === 'SMTP_PORT') return port;
      if (key === 'SMTP_USER') return user;
      if (key === 'SMTP_PASS') return pass;
      if (key === 'SMTP_FROM') return from;
      return undefined;
    }),
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('creates transporter when SMTP is fully configured', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EmailService,
          { provide: PrismaService, useValue: mockPrisma },
          { provide: ConfigService, useValue: makeConfig() },
        ],
      }).compile();

      const svc = module.get<EmailService>(EmailService);

      const nodemailer = require('nodemailer');
      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: 'smtp.test.com',
        port: 587,
        secure: false,
        auth: { user: 'smtp_user', pass: 'smtp_pass' },
      });
    });

    it('does not create transporter when SMTP config is missing', async () => {
      await Test.createTestingModule({
        providers: [
          EmailService,
          { provide: PrismaService, useValue: mockPrisma },
          { provide: ConfigService, useValue: makeConfig('', '', '', '') },
        ],
      }).compile();

      const nodemailer = require('nodemailer');
      expect(nodemailer.createTransport).not.toHaveBeenCalled();
    });
  });

  describe('sendNotification', () => {
    let service: EmailService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EmailService,
          { provide: PrismaService, useValue: mockPrisma },
          { provide: ConfigService, useValue: makeConfig() },
        ],
      }).compile();

      service = module.get<EmailService>(EmailService);
    });

    it('sends email when user has email and emailNotifications enabled', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        email: 'user@test.com',
        emailNotifications: true,
      });

      await service.sendNotification('user1', {
        subject: 'Test Subject',
        text: 'Hello World',
      });

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'noreply@test.com',
        to: 'user@test.com',
        subject: 'Test Subject',
        text: 'Hello World',
        html: undefined,
      });
    });

    it('skips sending when user.emailNotifications is false', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        email: 'user@test.com',
        emailNotifications: false,
      });

      await service.sendNotification('user1', { subject: 'Test', text: 'Body' });

      expect(mockTransporter.sendMail).not.toHaveBeenCalled();
    });

    it('skips sending when user has no email address', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        email: null,
        emailNotifications: true,
      });

      await service.sendNotification('user1', { subject: 'Test', text: 'Body' });

      expect(mockTransporter.sendMail).not.toHaveBeenCalled();
    });

    it('skips sending when user is not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await service.sendNotification('nonexistent', { subject: 'Test', text: 'Body' });

      expect(mockTransporter.sendMail).not.toHaveBeenCalled();
    });
  });
});
