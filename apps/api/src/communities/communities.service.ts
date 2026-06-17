import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommunityDto, UpdateCommunityDto, AddMemberDto, UpdateMemberRoleDto, HandleJoinRequestDto, TransferOwnershipDto } from './dto';
import { CommunityMemberRole, Prisma } from '@prisma/client';

const MEMBER_SELECT = {
  id: true,
  role: true,
  joinedAt: true,
  user: {
    select: { id: true, name: true, username: true, avatar: true },
  },
} as const;

const COMMUNITY_INCLUDE = {
  _count: { select: { members: true, groups: true, posts: true } },
  owner: { select: { id: true, name: true, username: true, avatar: true } },
  institution: { select: { id: true, name: true, acronym: true } },
} as const;

@Injectable()
export class CommunitiesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateCommunityDto) {
    const community = await this.prisma.community.create({
      data: {
        name: dto.name,
        description: dto.description ?? null,
        avatar: dto.avatar ?? null,
        banner: dto.banner ?? null,
        joinType: dto.joinType ?? 'OPEN',
        isListed: dto.isListed ?? true,
        ownerId: userId,
        institutionId: dto.institutionId ?? null,
        members: {
          create: { userId, role: 'OWNER' },
        },
      },
      include: COMMUNITY_INCLUDE,
    });

    return community;
  }

  async findAll(userId: string, institutionId?: string, search?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const userMemberships = await this.prisma.communityMember.findMany({
      where: { userId },
      select: { communityId: true, role: true },
    });
    const membershipMap = new Map(userMemberships.map((m) => [m.communityId, m.role]));

    const where: Prisma.CommunityWhereInput = {
      OR: [
        { isListed: true },
        { id: { in: Array.from(membershipMap.keys()) } },
      ],
    };

    if (institutionId) {
      where.institutionId = institutionId;
    }

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const [communities, total] = await Promise.all([
      this.prisma.community.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          ...COMMUNITY_INCLUDE,
          members: {
            where: { userId },
            select: { role: true },
            take: 1,
          },
        },
      }),
      this.prisma.community.count({ where }),
    ]);

    const mapped = communities.map((c) => ({
      ...c,
      membership: c.members[0]?.role ?? null,
      members: undefined,
    }));

    return { communities: mapped, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(communityId: string, userId: string) {
    const community = await this.prisma.community.findUnique({
      where: { id: communityId },
      include: {
        ...COMMUNITY_INCLUDE,
        members: {
          where: { userId },
          select: { role: true },
          take: 1,
        },
      },
    });

    if (!community) throw new NotFoundException('Community not found');

    return {
      ...community,
      membership: community.members[0]?.role ?? null,
      members: undefined,
    };
  }

  async update(communityId: string, userId: string, dto: UpdateCommunityDto) {
    await this.requireRole(communityId, userId, 'ADMIN');

    const community = await this.prisma.community.update({
      where: { id: communityId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.avatar !== undefined && { avatar: dto.avatar }),
        ...(dto.banner !== undefined && { banner: dto.banner }),
        ...(dto.joinType !== undefined && { joinType: dto.joinType }),
        ...(dto.isListed !== undefined && { isListed: dto.isListed }),
        ...(dto.institutionId !== undefined && { institutionId: dto.institutionId }),
      },
      include: COMMUNITY_INCLUDE,
    });

    return community;
  }

  async delete(communityId: string, userId: string) {
    const community = await this.prisma.community.findUnique({
      where: { id: communityId },
      select: { ownerId: true },
    });

    if (!community) throw new NotFoundException('Community not found');
    if (community.ownerId !== userId) throw new ForbiddenException('Only the owner can delete the community');

    await this.prisma.community.delete({ where: { id: communityId } });
    return { message: 'Community deleted successfully' };
  }

  async transferOwnership(communityId: string, userId: string, dto: TransferOwnershipDto) {
    const community = await this.prisma.community.findUnique({
      where: { id: communityId },
      select: { ownerId: true },
    });

    if (!community) throw new NotFoundException('Community not found');
    if (community.ownerId !== userId) throw new ForbiddenException('Only the owner can transfer ownership');
    if (dto.targetUserId === userId) throw new BadRequestException('Cannot transfer ownership to yourself');

    const isMember = await this.prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId, userId: dto.targetUserId } },
      select: { id: true },
    });

    if (!isMember) throw new BadRequestException('Target user must be a member of the community');

    await this.prisma.$transaction(async (tx) => {
      await tx.communityMember.update({
        where: { communityId_userId: { communityId, userId: dto.targetUserId } },
        data: { role: 'OWNER' },
      });

      await tx.communityMember.update({
        where: { communityId_userId: { communityId, userId } },
        data: { role: 'ADMIN' },
      });

      await tx.community.update({
        where: { id: communityId },
        data: { ownerId: dto.targetUserId },
      });
    });

    return this.findOne(communityId, dto.targetUserId);
  }

  async addMember(communityId: string, actorId: string, dto: AddMemberDto) {
    await this.requireRole(communityId, actorId, 'ADMIN');

    const existing = await this.prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId, userId: dto.userId } },
    });

    if (existing) throw new ConflictException('User is already a member');

    const member = await this.prisma.communityMember.create({
      data: { communityId, userId: dto.userId, role: 'MEMBER' },
      select: MEMBER_SELECT,
    });

    return member;
  }

  async updateMemberRole(communityId: string, actorId: string, targetUserId: string, dto: UpdateMemberRoleDto) {
    const actorMember = await this.prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId, userId: actorId } },
      select: { role: true },
    });
    if (!actorMember) throw new ForbiddenException('You are not a member of this community');

    const targetMember = await this.prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId, userId: targetUserId } },
      select: { role: true },
    });
    if (!targetMember) throw new NotFoundException('Target user is not a member');

    const hierarchy: Record<CommunityMemberRole, number> = {
      OWNER: 4, ADMIN: 3, MODERATOR: 2, MEMBER: 1,
    };

    if (hierarchy[actorMember.role] <= hierarchy[targetMember.role]) {
      throw new ForbiddenException('You cannot modify a user with equal or higher role');
    }

    if (dto.role === 'ADMIN' && actorMember.role !== 'OWNER') {
      throw new ForbiddenException('Only the owner can promote to ADMIN');
    }

    if (dto.role === 'OWNER') {
      throw new BadRequestException('Use the transfer endpoint to change ownership');
    }

    const updated = await this.prisma.communityMember.update({
      where: { communityId_userId: { communityId, userId: targetUserId } },
      data: { role: dto.role },
      select: MEMBER_SELECT,
    });

    return updated;
  }

  async removeMember(communityId: string, actorId: string, targetUserId: string) {
    const actorMember = await this.prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId, userId: actorId } },
      select: { role: true },
    });
    if (!actorMember) throw new ForbiddenException('You are not a member of this community');

    const targetMember = await this.prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId, userId: targetUserId } },
      select: { role: true },
    });
    if (!targetMember) throw new NotFoundException('Target user is not a member');

    if (targetMember.role === 'OWNER') {
      throw new ForbiddenException('Cannot remove the community owner');
    }

    const hierarchy: Record<CommunityMemberRole, number> = {
      OWNER: 4, ADMIN: 3, MODERATOR: 2, MEMBER: 1,
    };

    if (hierarchy[actorMember.role] <= hierarchy[targetMember.role]) {
      throw new ForbiddenException('You cannot remove a user with equal or higher role');
    }

    await this.prisma.communityMember.delete({
      where: { communityId_userId: { communityId, userId: targetUserId } },
    });

    return { message: 'Member removed successfully' };
  }

  async findMembers(communityId: string, role?: CommunityMemberRole, page = 1, limit = 30) {
    const skip = (page - 1) * limit;
    const where: Prisma.CommunityMemberWhereInput = { communityId };

    if (role) {
      where.role = role;
    }

    const [members, total] = await Promise.all([
      this.prisma.communityMember.findMany({
        where,
        skip,
        take: limit,
        orderBy: { joinedAt: 'asc' },
        select: MEMBER_SELECT,
      }),
      this.prisma.communityMember.count({ where }),
    ]);

    return { members, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async listMyCommunities(userId: string) {
    const memberships = await this.prisma.communityMember.findMany({
      where: { userId },
      include: {
        community: {
          include: COMMUNITY_INCLUDE,
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    return memberships.map((m) => ({
      ...m.community,
      membership: m.role,
    }));
  }

  async joinCommunity(communityId: string, userId: string) {
    const community = await this.prisma.community.findUnique({
      where: { id: communityId },
      select: { joinType: true, id: true },
    });

    if (!community) throw new NotFoundException('Community not found');

    const existing = await this.prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId, userId } },
      select: { id: true },
    });

    if (existing) throw new ConflictException('You are already a member');

    if (community.joinType === 'OPEN') {
      const member = await this.prisma.communityMember.create({
        data: { communityId, userId, role: 'MEMBER' },
        select: MEMBER_SELECT,
      });

      return { joined: true, requiresApproval: false, member };
    }

    if (community.joinType === 'INVITE_ONLY') {
      throw new ForbiddenException('This community is invite-only');
    }

    const existingRequest = await this.prisma.communityJoinRequest.findUnique({
      where: { communityId_userId: { communityId, userId } },
    });

    if (existingRequest) {
      if (existingRequest.status === 'PENDING') {
        throw new ConflictException('You already have a pending join request');
      }
      if (existingRequest.status === 'APPROVED') {
        throw new ConflictException('You are already a member');
      }

      await this.prisma.communityJoinRequest.update({
        where: { id: existingRequest.id },
        data: { status: 'PENDING' },
      });
      return { joined: false, requiresApproval: true };
    }

    await this.prisma.communityJoinRequest.create({
      data: { communityId, userId },
    });

    return { joined: false, requiresApproval: true };
  }

  async leaveCommunity(communityId: string, userId: string) {
    const member = await this.prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId, userId } },
      select: { role: true },
    });

    if (!member) throw new NotFoundException('You are not a member of this community');
    if (member.role === 'OWNER') throw new BadRequestException('Owner cannot leave. Transfer ownership first.');

    await this.prisma.communityMember.delete({
      where: { communityId_userId: { communityId, userId } },
    });

    return { message: 'Left community successfully' };
  }

  async getJoinRequests(communityId: string, userId: string) {
    await this.requireRole(communityId, userId, 'ADMIN');

    const requests = await this.prisma.communityJoinRequest.findMany({
      where: { communityId, status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: { id: true, name: true, username: true, avatar: true } },
      },
    });

    return requests;
  }

  async handleJoinRequest(communityId: string, userId: string, requestId: string, dto: HandleJoinRequestDto) {
    await this.requireRole(communityId, userId, 'ADMIN');

    const request = await this.prisma.communityJoinRequest.findUnique({
      where: { id: requestId },
    });

    if (!request || request.communityId !== communityId) {
      throw new NotFoundException('Join request not found');
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestException('This request has already been handled');
    }

    if (dto.status === 'APPROVED') {
      await this.prisma.$transaction(async (tx) => {
        await tx.communityJoinRequest.update({
          where: { id: requestId },
          data: { status: 'APPROVED' },
        });

        await tx.communityMember.create({
          data: {
            communityId,
            userId: request.userId,
            role: 'MEMBER',
          },
        });
      });

      return { approved: true };
    }

    await this.prisma.communityJoinRequest.update({
      where: { id: requestId },
      data: { status: 'DECLINED' },
    });

    return { approved: false };
  }

  private async requireRole(communityId: string, userId: string, minRole: CommunityMemberRole) {
    const member = await this.prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId, userId } },
      select: { role: true },
    });

    if (!member) throw new ForbiddenException('You are not a member of this community');

    const hierarchy: Record<CommunityMemberRole, number> = {
      OWNER: 4, ADMIN: 3, MODERATOR: 2, MEMBER: 1,
    };

    if (hierarchy[member.role] < hierarchy[minRole]) {
      throw new ForbiddenException(`Access denied. Required role: ${minRole} or higher`);
    }
  }
}
