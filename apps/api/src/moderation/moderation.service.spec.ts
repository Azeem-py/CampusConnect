import { ModerationService } from './moderation.service';
import { PrismaService } from '../prisma/prisma.service';
import { ReportReason, ReportStatus, PostStatus } from '@campus-connect/db';
import { BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';

const makePrisma = (overrides: Partial<Record<string, jest.Mock>> = {}) =>
  ({
    report: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    post: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    comment: {
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockTx)),
    ...overrides,
  }) as unknown as jest.Mocked<PrismaService>;

const mockTx = {
  post: {
    delete: jest.fn().mockResolvedValue({}),
  },
  comment: {
    delete: jest.fn().mockResolvedValue({}),
  },
  user: {
    update: jest.fn().mockResolvedValue({}),
  },
  report: {
    update: jest.fn().mockResolvedValue({}),
  },
};

describe('ModerationService', () => {
  let service: ModerationService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(() => {
    prisma = makePrisma();
    service = new ModerationService(prisma);
    jest.clearAllMocks();
  });

  describe('createReport', () => {
    it('throws BadRequestException if no target is provided', async () => {
      await expect(
        service.createReport('u1', { reason: ReportReason.SPAM }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException if multiple targets are provided', async () => {
      await expect(
        service.createReport('u1', {
          reason: ReportReason.SPAM,
          postId: 'p1',
          commentId: 'c1',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException if target post is not found', async () => {
      (prisma.post.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.createReport('u1', {
          reason: ReportReason.SPAM,
          postId: 'p1',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException if reporting own post', async () => {
      (prisma.post.findUnique as jest.Mock).mockResolvedValue({ id: 'p1', authorId: 'u1' });

      await expect(
        service.createReport('u1', {
          reason: ReportReason.SPAM,
          postId: 'p1',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws ConflictException if user already has a pending report on the post', async () => {
      (prisma.post.findUnique as jest.Mock).mockResolvedValue({ id: 'p1', authorId: 'u2' });
      (prisma.report.findFirst as jest.Mock).mockResolvedValue({ id: 'r1' });

      await expect(
        service.createReport('u1', {
          reason: ReportReason.SPAM,
          postId: 'p1',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('creates report and auto-hides (DRAFT) post if pending reports >= 3', async () => {
      (prisma.post.findUnique as jest.Mock).mockResolvedValue({ id: 'p1', authorId: 'u2' });
      (prisma.report.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.report.create as jest.Mock).mockResolvedValue({ id: 'new-report' });
      (prisma.report.count as jest.Mock).mockResolvedValue(3);

      const result = await service.createReport('u1', {
        reason: ReportReason.SPAM,
        description: 'Spam post details',
        postId: 'p1',
      });

      expect(prisma.report.create).toHaveBeenCalledWith({
        data: {
          reporterId: 'u1',
          reason: ReportReason.SPAM,
          description: 'Spam post details',
          postId: 'p1',
        },
      });
      expect(prisma.post.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: { status: PostStatus.DRAFT },
      });
      expect(result).toEqual({ id: 'new-report' });
    });
  });

  describe('getReports', () => {
    it('returns paginated and filtered reports', async () => {
      const mockReports = [{ id: 'r1', reason: ReportReason.SPAM }];
      (prisma.report.findMany as jest.Mock).mockResolvedValue(mockReports);
      (prisma.report.count as jest.Mock).mockResolvedValue(1);

      const result = await service.getReports(ReportStatus.PENDING, ReportReason.SPAM, 1, 10);

      expect(prisma.report.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: ReportStatus.PENDING, reason: ReportReason.SPAM },
          skip: 0,
          take: 10,
        }),
      );
      expect(result.total).toBe(1);
      expect(result.reports).toEqual(mockReports);
    });
  });

  describe('getReportMetrics', () => {
    it('aggregates status counts correctly', async () => {
      (prisma.report.count as jest.Mock)
        .mockResolvedValueOnce(5) // pending
        .mockResolvedValueOnce(3) // resolved
        .mockResolvedValueOnce(2); // dismissed
      (prisma.user.count as jest.Mock).mockResolvedValue(1); // banned

      const result = await service.getReportMetrics();

      expect(result).toEqual({
        pending: 5,
        resolved: 3,
        dismissed: 2,
        activeInfractions: 1,
      });
    });
  });

  describe('resolveReport', () => {
    it('throws NotFoundException if report is not found', async () => {
      (prisma.report.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.resolveReport('admin-id', 'r1', { status: ReportStatus.DISMISSED }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException if report is already resolved', async () => {
      (prisma.report.findUnique as jest.Mock).mockResolvedValue({
        id: 'r1',
        status: ReportStatus.RESOLVED,
      });

      await expect(
        service.resolveReport('admin-id', 'r1', { status: ReportStatus.DISMISSED }),
      ).rejects.toThrow(BadRequestException);
    });

    it('dismisses a report successfully', async () => {
      (prisma.report.findUnique as jest.Mock).mockResolvedValue({
        id: 'r1',
        status: ReportStatus.PENDING,
      });
      (prisma.report.update as jest.Mock).mockResolvedValue({ id: 'r1', status: ReportStatus.DISMISSED });

      const result = await service.resolveReport('admin-id', 'r1', {
        status: ReportStatus.DISMISSED,
        resolutionNote: 'No violation found.',
      });

      expect(prisma.report.update).toHaveBeenCalledWith({
        where: { id: 'r1' },
        data: {
          status: ReportStatus.DISMISSED,
          resolverId: 'admin-id',
          resolutionNote: 'No violation found.',
        },
      });
    });

    it('resolves a report with post deletion and user ban successfully within a transaction', async () => {
      (prisma.report.findUnique as jest.Mock).mockResolvedValue({
        id: 'r1',
        status: ReportStatus.PENDING,
        postId: 'p1',
        post: { id: 'p1', authorId: 'offender-id' },
      });

      const result = await service.resolveReport('admin-id', 'r1', {
        status: ReportStatus.RESOLVED,
        resolutionNote: 'Violated TOS.',
        deleteContent: true,
        banUser: true,
      });

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(mockTx.post.delete).toHaveBeenCalledWith({ where: { id: 'p1' } });
      expect(mockTx.user.update).toHaveBeenCalledWith({
        where: { id: 'offender-id' },
        data: {
          isDeactivated: true,
          reputationScore: { decrement: 20 },
        },
      });
      expect(mockTx.report.update).toHaveBeenCalledWith({
        where: { id: 'r1' },
        data: {
          status: ReportStatus.RESOLVED,
          resolverId: 'admin-id',
          resolutionNote: 'Violated TOS.',
        },
      });
      expect(result.status).toBe(ReportStatus.RESOLVED);
    });
  });
});
