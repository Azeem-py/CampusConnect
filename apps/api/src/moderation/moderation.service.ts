import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReportDto, ResolveReportDto } from './dto';
import { ReportReason, ReportStatus, PostStatus } from '@campus-connect/db';

@Injectable()
export class ModerationService {
  constructor(private prisma: PrismaService) {}

  async createReport(reporterId: string, dto: CreateReportDto) {
    const targets = [dto.postId, dto.commentId, dto.reportedUserId].filter(Boolean);
    
    if (targets.length !== 1) {
      throw new BadRequestException('Must report exactly one target: postId, commentId, or reportedUserId.');
    }

    // 1. Verify Post Target
    if (dto.postId) {
      const post = await this.prisma.post.findUnique({
        where: { id: dto.postId },
      });
      if (!post) {
        throw new NotFoundException('Target post not found.');
      }
      if (post.authorId === reporterId) {
        throw new BadRequestException('You cannot report your own post.');
      }

      const existingReport = await this.prisma.report.findFirst({
        where: { reporterId, postId: dto.postId, status: ReportStatus.PENDING },
      });
      if (existingReport) {
        throw new ConflictException('You have already reported this post.');
      }

      const report = await this.prisma.report.create({
        data: {
          reporterId,
          reason: dto.reason,
          description: dto.description,
          postId: dto.postId,
        },
      });

      // Auto-Draft/Flag Post if pending reports >= 3
      const pendingCount = await this.prisma.report.count({
        where: { postId: dto.postId, status: ReportStatus.PENDING },
      });

      if (pendingCount >= 3) {
        await this.prisma.post.update({
          where: { id: dto.postId },
          data: { status: PostStatus.DRAFT },
        });
      }

      return report;
    }

    // 2. Verify Comment Target
    if (dto.commentId) {
      const comment = await this.prisma.comment.findUnique({
        where: { id: dto.commentId },
      });
      if (!comment) {
        throw new NotFoundException('Target comment not found.');
      }
      if (comment.authorId === reporterId) {
        throw new BadRequestException('You cannot report your own comment.');
      }

      const existingReport = await this.prisma.report.findFirst({
        where: { reporterId, commentId: dto.commentId, status: ReportStatus.PENDING },
      });
      if (existingReport) {
        throw new ConflictException('You have already reported this comment.');
      }

      return this.prisma.report.create({
        data: {
          reporterId,
          reason: dto.reason,
          description: dto.description,
          commentId: dto.commentId,
        },
      });
    }

    // 3. Verify User Target
    if (dto.reportedUserId) {
      const targetUser = await this.prisma.user.findUnique({
        where: { id: dto.reportedUserId },
      });
      if (!targetUser) {
        throw new NotFoundException('Target user profile not found.');
      }
      if (targetUser.id === reporterId) {
        throw new BadRequestException('You cannot report your own profile.');
      }

      const existingReport = await this.prisma.report.findFirst({
        where: { reporterId, reportedUserId: dto.reportedUserId, status: ReportStatus.PENDING },
      });
      if (existingReport) {
        throw new ConflictException('You have already reported this profile.');
      }

      return this.prisma.report.create({
        data: {
          reporterId,
          reason: dto.reason,
          description: dto.description,
          reportedUserId: dto.reportedUserId,
        },
      });
    }

    throw new BadRequestException('Invalid report target.');
  }

  async getReports(status?: ReportStatus, reason?: ReportReason, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) where.status = status;
    if (reason) where.reason = reason;

    const [reports, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          reporter: {
            select: { id: true, name: true, username: true },
          },
          reportedUser: {
            select: { id: true, name: true, username: true, avatar: true },
          },
          post: {
            include: {
              author: {
                select: { id: true, name: true, username: true },
              },
            },
          },
          comment: {
            include: {
              author: {
                select: { id: true, name: true, username: true },
              },
            },
          },
        },
      }),
      this.prisma.report.count({ where }),
    ]);

    return {
      reports,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getReportMetrics() {
    const [pending, resolved, dismissed] = await Promise.all([
      this.prisma.report.count({ where: { status: ReportStatus.PENDING } }),
      this.prisma.report.count({ where: { status: ReportStatus.RESOLVED } }),
      this.prisma.report.count({ where: { status: ReportStatus.DISMISSED } }),
    ]);

    // Query active infractions (Total unique deactivated accounts or resolved content reports)
    const activeInfractions = await this.prisma.user.count({ where: { isDeactivated: true } });

    return {
      pending,
      resolved,
      dismissed,
      activeInfractions,
    };
  }

  async resolveReport(resolverId: string, reportId: string, dto: ResolveReportDto) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      include: {
        post: true,
        comment: true,
      },
    });

    if (!report) {
      throw new NotFoundException('Report record not found.');
    }

    if (report.status !== ReportStatus.PENDING) {
      throw new BadRequestException('This report has already been processed.');
    }

    // Determine target content author to apply reputation penalties/suspensions
    let offendingUserId: string | null = null;
    if (report.reportedUserId) {
      offendingUserId = report.reportedUserId;
    } else if (report.post) {
      offendingUserId = report.post.authorId;
    } else if (report.comment) {
      offendingUserId = report.comment.authorId;
    }

    // 1. Process Report Dismissal
    if (dto.status === ReportStatus.DISMISSED) {
      return this.prisma.report.update({
        where: { id: reportId },
        data: {
          status: ReportStatus.DISMISSED,
          resolverId,
          resolutionNote: dto.resolutionNote,
        },
      });
    }

    // 2. Process Content Violation & Resolution
    if (dto.status === ReportStatus.RESOLVED) {
      let updatedReport: any;
      await this.prisma.$transaction(async (tx) => {
        // Delete post or comment content if requested
        if (dto.deleteContent) {
          if (report.postId) {
            await tx.post.delete({ where: { id: report.postId } }).catch(() => {});
          }
          if (report.commentId) {
            await tx.comment.delete({ where: { id: report.commentId } }).catch(() => {});
          }
        }

        // Apply profile deactivation and reputation penalty if requested
        if (dto.banUser && offendingUserId) {
          await tx.user.update({
            where: { id: offendingUserId },
            data: {
              isDeactivated: true,
              reputationScore: { decrement: 20 },
            },
          });
        }

        // Update the report to resolved
        updatedReport = await tx.report.update({
          where: { id: reportId },
          data: {
            status: ReportStatus.RESOLVED,
            resolverId,
            resolutionNote: dto.resolutionNote,
          },
        });
      });

      return updatedReport;
    }

    throw new BadRequestException('Invalid resolution status.');
  }
}
