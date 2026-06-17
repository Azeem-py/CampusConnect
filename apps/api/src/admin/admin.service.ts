import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInstitutionDto, UpdateInstitutionDto, CreateDepartmentDto, UpdateDepartmentDto, CreateBannedWordDto, UpdateBannedWordDto, UpdateUserByAdminDto, AdminFlagUserDto, AdminFlagPostDto } from './dto';
import { PostStatus, ReportStatus, ReportReason } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // ─────────────── USERS ───────────────

  async getUsers(page: number, limit: number, search?: string, role?: string, status?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (status === 'deactivated') {
      where.isDeactivated = true;
    } else if (status === 'active') {
      where.isDeactivated = false;
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          username: true,
          role: true,
          isDeactivated: true,
          reputationScore: true,
          school: true,
          department: true,
          major: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { posts: true, comments: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { users, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        _count: { select: { posts: true, comments: true, reportsCreated: true, reportsAgainst: true } },
      },
    });

    if (!user) throw new NotFoundException('User not found');
    const { password: _, refreshTokenHash: __, ...userWithoutSensitive } = user;
    return userWithoutSensitive;
  }

  async updateUser(userId: string, dto: UpdateUserByAdminDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (dto.username) {
      const existing = await this.prisma.user.findFirst({
        where: { username: dto.username, NOT: { id: userId } },
      });
      if (existing) throw new BadRequestException('Username already taken');
    }

    if (dto.email) {
      const existing = await this.prisma.user.findFirst({
        where: { email: dto.email, NOT: { id: userId } },
      });
      if (existing) throw new BadRequestException('Email already taken');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
    });

    const { password: _, refreshTokenHash: __, ...userWithoutSensitive } = updated;
    return userWithoutSensitive;
  }

  async disableUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { isDeactivated: !user.isDeactivated },
    });

    return {
      message: updated.isDeactivated ? 'User account disabled' : 'User account re-enabled',
      isDeactivated: updated.isDeactivated,
    };
  }

  async flagUser(adminId: string, userId: string, dto: AdminFlagUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const report = await this.prisma.report.create({
      data: {
        reporterId: adminId,
        reportedUserId: userId,
        reason: ReportReason.INAPPROPRIATE_CONTENT,
        description: dto.reason || 'Flagged by admin',
        status: ReportStatus.PENDING,
      },
    });

    return report;
  }

  async deleteUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.$transaction(async (tx) => {
      const userPostIds = (await tx.post.findMany({ where: { authorId: userId }, select: { id: true } })).map(p => p.id);
      await tx.comment.deleteMany({ where: { postId: { in: userPostIds } } });
      await tx.comment.deleteMany({ where: { authorId: userId } });
      await tx.vote.deleteMany({ where: { userId } });
      await tx.vote.deleteMany({ where: { postId: { in: userPostIds } } });
      await tx.pollVote.deleteMany({ where: { userId } });
      await tx.bookmark.deleteMany({ where: { userId } });
      await tx.notification.deleteMany({ where: { recipientId: userId } });
      await tx.notification.deleteMany({ where: { actorId: userId } });
      await tx.notificationPreference.deleteMany({ where: { userId } });
      await tx.pushSubscription.deleteMany({ where: { userId } });
      await tx.report.deleteMany({ where: { reporterId: userId } });
      await tx.report.deleteMany({ where: { reportedUserId: userId } });
      await tx.report.deleteMany({ where: { resolverId: userId } });
      await tx.communityMember.deleteMany({ where: { userId } });
      await tx.communityJoinRequest.deleteMany({ where: { userId } });
      await tx.groupMember.deleteMany({ where: { userId } });
      await tx.quizAttempt.deleteMany({ where: { userId } });
      await tx.quiz.deleteMany({ where: { creatorId: userId } });
      const ownedCommunities = await tx.community.findMany({ where: { ownerId: userId }, select: { id: true } });
      for (const c of ownedCommunities) {
        await tx.communityMember.deleteMany({ where: { communityId: c.id } });
        await tx.communityJoinRequest.deleteMany({ where: { communityId: c.id } });
        await tx.communityGroup.deleteMany({ where: { communityId: c.id } });
        await tx.post.updateMany({ where: { communityId: c.id }, data: { communityId: null } });
      }
      await tx.community.deleteMany({ where: { ownerId: userId } });
      await tx.post.deleteMany({ where: { authorId: userId } });
      await tx.user.delete({ where: { id: userId } });
    });
    return { message: 'User permanently deleted' };
  }

  // ─────────────── INSTITUTIONS ───────────────

  async getInstitutions(type?: string) {
    const where = type ? { type: type as any } : {};
    return this.prisma.institution.findMany({
      where,
      orderBy: { name: 'asc' },
      include: { _count: { select: { departments: true } } },
    });
  }

  async getInstitutionById(id: string) {
    const institution = await this.prisma.institution.findUnique({
      where: { id },
      include: { departments: { orderBy: { name: 'asc' } } },
    });
    if (!institution) throw new NotFoundException('Institution not found');
    return institution;
  }

  async createInstitution(dto: CreateInstitutionDto) {
    const existing = await this.prisma.institution.findFirst({ where: { name: dto.name } });
    if (existing) throw new ConflictException('Institution with this name already exists');

    return this.prisma.institution.create({ data: dto });
  }

  async updateInstitution(id: string, dto: UpdateInstitutionDto) {
    const institution = await this.prisma.institution.findUnique({ where: { id } });
    if (!institution) throw new NotFoundException('Institution not found');

    if (dto.name) {
      const existing = await this.prisma.institution.findFirst({
        where: { name: dto.name, NOT: { id } },
      });
      if (existing) throw new ConflictException('Institution with this name already exists');
    }

    return this.prisma.institution.update({ where: { id }, data: dto });
  }

  async deleteInstitution(id: string) {
    const institution = await this.prisma.institution.findUnique({ where: { id } });
    if (!institution) throw new NotFoundException('Institution not found');

    await this.prisma.$transaction(async (tx) => {
      await tx.community.updateMany({ where: { institutionId: id }, data: { institutionId: null } });
      await tx.department.deleteMany({ where: { institutionId: id } });
      await tx.institution.delete({ where: { id } });
    });
    return { message: 'Institution deleted successfully' };
  }

  async createDepartment(institutionId: string, dto: CreateDepartmentDto) {
    const institution = await this.prisma.institution.findUnique({ where: { id: institutionId } });
    if (!institution) throw new NotFoundException('Institution not found');

    const existing = await this.prisma.department.findFirst({
      where: { name: dto.name, institutionId },
    });
    if (existing) throw new ConflictException('Department with this name already exists in this institution');

    return this.prisma.department.create({
      data: { name: dto.name, institutionId },
    });
  }

  async updateDepartment(id: string, dto: UpdateDepartmentDto) {
    const department = await this.prisma.department.findUnique({ where: { id } });
    if (!department) throw new NotFoundException('Department not found');

    const existing = await this.prisma.department.findFirst({
      where: { name: dto.name, institutionId: department.institutionId, NOT: { id } },
    });
    if (existing) throw new ConflictException('Department with this name already exists in this institution');

    return this.prisma.department.update({ where: { id }, data: dto });
  }

  async deleteDepartment(id: string) {
    const department = await this.prisma.department.findUnique({ where: { id } });
    if (!department) throw new NotFoundException('Department not found');

    await this.prisma.department.delete({ where: { id } });
    return { message: 'Department deleted successfully' };
  }

  // ─────────────── POSTS & COMMENTS ───────────────

  async getPosts(page: number, limit: number, search?: string, status?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.OR = [
        { content: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: { id: true, name: true, username: true, avatar: true },
          },
          _count: { select: { comments: true, votes: true, reports: true } },
          reports: {
            where: { status: ReportStatus.PENDING },
            select: { id: true },
          },
        },
      }),
      this.prisma.post.count({ where }),
    ]);

    return { posts, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async deletePost(postId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    await this.prisma.$transaction(async (tx) => {
      await tx.comment.deleteMany({ where: { postId } });
      await tx.vote.deleteMany({ where: { postId } });
      await tx.post.delete({ where: { id: postId } });
    });
    return { message: 'Post deleted successfully' };
  }

  async flagPost(postId: string, adminId: string, dto: AdminFlagPostDto) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    await this.prisma.post.update({
      where: { id: postId },
      data: { status: PostStatus.DRAFT },
    });

    const report = await this.prisma.report.create({
      data: {
        reporterId: adminId,
        postId,
        reason: ReportReason.INAPPROPRIATE_CONTENT,
        description: dto.reason || 'Flagged by admin',
        status: ReportStatus.PENDING,
      },
    });

    return report;
  }

  async unflagPost(postId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    const pendingReports = await this.prisma.report.findMany({
      where: { postId, status: ReportStatus.PENDING },
    });

    await this.prisma.report.updateMany({
      where: { postId, status: ReportStatus.PENDING },
      data: { status: ReportStatus.DISMISSED },
    });

    await this.prisma.post.update({
      where: { id: postId },
      data: { status: PostStatus.PUBLISHED },
    });

    return { message: 'Post unflagged and published', dismissedReports: pendingReports.length };
  }

  async deleteComment(commentId: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('Comment not found');

    await this.prisma.$transaction(async (tx) => {
      await tx.vote.deleteMany({ where: { commentId } });
      await tx.comment.deleteMany({ where: { parentId: commentId } });
      await tx.comment.delete({ where: { id: commentId } });
    });
    return { message: 'Comment deleted successfully' };
  }

  // ─────────────── BANNED WORDS ───────────────

  async getBannedWords() {
    return this.prisma.bannedWord.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async createBannedWord(dto: CreateBannedWordDto) {
    const existing = await this.prisma.bannedWord.findUnique({ where: { pattern: dto.pattern } });
    if (existing) throw new ConflictException('Banned word pattern already exists');

    return this.prisma.bannedWord.create({ data: dto });
  }

  async updateBannedWord(id: string, dto: UpdateBannedWordDto) {
    const bannedWord = await this.prisma.bannedWord.findUnique({ where: { id } });
    if (!bannedWord) throw new NotFoundException('Banned word not found');

    if (dto.pattern && dto.pattern !== bannedWord.pattern) {
      const existing = await this.prisma.bannedWord.findUnique({ where: { pattern: dto.pattern } });
      if (existing) throw new ConflictException('Banned word pattern already exists');
    }

    return this.prisma.bannedWord.update({ where: { id }, data: dto });
  }

  async deleteBannedWord(id: string) {
    const bannedWord = await this.prisma.bannedWord.findUnique({ where: { id } });
    if (!bannedWord) throw new NotFoundException('Banned word not found');

    await this.prisma.bannedWord.delete({ where: { id } });
    return { message: 'Banned word removed successfully' };
  }

  // ─────────────── ANALYTICS ───────────────

  async getAnalyticsOverview() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(todayStart.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalPosts,
      totalComments,
      totalInstitutions,
      totalDepartments,
      newUsersToday,
      postsToday,
      totalReports,
      pendingReports,
      bannedUsers,
      usersLastMonth,
      postsLastMonth,
      reportsLastMonth,
      totalBannedWords,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.post.count(),
      this.prisma.comment.count(),
      this.prisma.institution.count(),
      this.prisma.department.count(),
      this.prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
      this.prisma.post.count({ where: { createdAt: { gte: todayStart } } }),
      this.prisma.report.count(),
      this.prisma.report.count({ where: { status: ReportStatus.PENDING } }),
      this.prisma.user.count({ where: { isDeactivated: true } }),
      this.prisma.user.count({ where: { createdAt: { gte: monthAgo } } }),
      this.prisma.post.count({ where: { createdAt: { gte: monthAgo } } }),
      this.prisma.report.count({ where: { createdAt: { gte: monthAgo } } }),
      this.prisma.bannedWord.count(),
    ]);

    const todayActiveUserIds = await this.prisma.post.findMany({
      where: { createdAt: { gte: todayStart } },
      select: { authorId: true },
      distinct: ['authorId'],
    });
    const activeUsersToday = todayActiveUserIds.length;

    const usersGrowth = usersLastMonth && totalUsers ? ((usersLastMonth / totalUsers) * 100).toFixed(1) : '0';

    return {
      totalUsers,
      totalPosts,
      totalComments,
      totalInstitutions,
      totalDepartments,
      activeUsersToday,
      newUsersToday,
      postsToday,
      totalReports,
      pendingReports,
      bannedUsers,
      totalBannedWords,
      usersGrowth: `${usersGrowth}%`,
    };
  }

  async getUserAnalytics(period: '7d' | '30d' | '90d' = '30d') {
    const daysMap = { '7d': 7, '30d': 30, '90d': 90 };
    const days = daysMap[period] || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const users = await this.prisma.user.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true, role: true },
      orderBy: { createdAt: 'asc' },
    });

    const userGrowth = await this.buildTimeSeries(users, days, 'createdAt');
    const roleDistribution = await this.prisma.user.groupBy({
      by: ['role'],
      _count: { id: true },
    });

    return {
      userGrowth,
      roleDistribution: roleDistribution.map((r) => ({ role: r.role, count: r._count.id })),
    };
  }

  async getPostAnalytics(period: '7d' | '30d' | '90d' = '30d') {
    const daysMap = { '7d': 7, '30d': 30, '90d': 90 };
    const days = daysMap[period] || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const posts = await this.prisma.post.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true, status: true },
      orderBy: { createdAt: 'asc' },
    });

    const postTrend = await this.buildTimeSeries(posts, days, 'createdAt');

    const totalPosts = await this.prisma.post.count();
    const publishedPosts = await this.prisma.post.count({ where: { status: PostStatus.PUBLISHED } });
    const draftPosts = await this.prisma.post.count({ where: { status: PostStatus.DRAFT } });

    return {
      postTrend,
      totalPosts,
      publishedPosts,
      draftPosts,
    };
  }

  async getEngagementAnalytics(period: '7d' | '30d' | '90d' = '30d') {
    const daysMap = { '7d': 7, '30d': 30, '90d': 90 };
    const days = daysMap[period] || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [comments, votes] = await Promise.all([
      this.prisma.comment.findMany({
        where: { createdAt: { gte: startDate } },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.vote.findMany({
        where: { createdAt: { gte: startDate } },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    const commentTrend = await this.buildTimeSeries(comments, days, 'createdAt');
    const voteTrend = await this.buildTimeSeries(votes, days, 'createdAt');

    const totalComments = await this.prisma.comment.count();
    const totalVotes = await this.prisma.vote.count();

    return {
      commentTrend,
      voteTrend,
      totalComments,
      totalVotes,
    };
  }

  // ─────────────── HELPERS ───────────────

  private async buildTimeSeries(
    items: { createdAt: Date }[],
    days: number,
    field: string,
  ): Promise<{ date: string; count: number }[]> {
    const series: { date: string; count: number }[] = [];
    const map = new Map<string, number>();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      map.set(key, 0);
      series.push({ date: key, count: 0 });
    }

    for (const item of items) {
      const key = item.createdAt.toISOString().split('T')[0];
      if (map.has(key)) {
        map.set(key, map.get(key)! + 1);
      }
    }

    return series.map((s) => ({ ...s, count: map.get(s.date) || 0 }));
  }
}
