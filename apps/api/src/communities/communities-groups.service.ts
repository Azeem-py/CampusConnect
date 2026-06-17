import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupDto, UpdateGroupDto, AddGroupMemberDto, UpdateGroupMemberRoleDto } from './dto';
import { CommunityMemberRole, GroupMemberRole } from '@prisma/client';

const GROUP_MEMBER_SELECT = {
  id: true,
  role: true,
  joinedAt: true,
  user: {
    select: { id: true, name: true, username: true, avatar: true },
  },
} as const;

@Injectable()
export class CommunitiesGroupsService {
  constructor(private prisma: PrismaService) {}

  async createGroup(communityId: string, actorId: string, dto: CreateGroupDto) {
    await this.requireCommunityRole(communityId, actorId, 'MODERATOR');

    const group = await this.prisma.communityGroup.create({
      data: {
        name: dto.name,
        description: dto.description ?? null,
        avatar: dto.avatar ?? null,
        banner: dto.banner ?? null,
        communityId,
        members: {
          create: { userId: actorId, role: 'MODERATOR' },
        },
      },
      include: {
        _count: { select: { members: true } },
      },
    });

    return group;
  }

  async findGroups(communityId: string, userId: string) {
    const groups = await this.prisma.communityGroup.findMany({
      where: { communityId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { members: true } },
        members: {
          where: { userId },
          select: { role: true },
          take: 1,
        },
      },
    });

    return groups.map((g) => ({
      ...g,
      membership: g.members[0]?.role ?? null,
      members: undefined,
    }));
  }

  async findGroup(communityId: string, groupId: string, userId: string) {
    const group = await this.prisma.communityGroup.findUnique({
      where: { id: groupId },
      include: {
        _count: { select: { members: true } },
        members: {
          where: { userId },
          select: { role: true },
          take: 1,
        },
      },
    });

    if (!group || group.communityId !== communityId) {
      throw new NotFoundException('Group not found');
    }

    return {
      ...group,
      membership: group.members[0]?.role ?? null,
      members: undefined,
    };
  }

  async updateGroup(communityId: string, groupId: string, actorId: string, dto: UpdateGroupDto) {
    const group = await this.prisma.communityGroup.findUnique({
      where: { id: groupId },
      select: { communityId: true },
    });
    if (!group || group.communityId !== communityId) throw new NotFoundException('Group not found');

    await this.requireCommunityRole(communityId, actorId, 'MODERATOR');

    const updated = await this.prisma.communityGroup.update({
      where: { id: groupId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.avatar !== undefined && { avatar: dto.avatar }),
        ...(dto.banner !== undefined && { banner: dto.banner }),
      },
      include: { _count: { select: { members: true } } },
    });

    return updated;
  }

  async deleteGroup(communityId: string, groupId: string, actorId: string) {
    const group = await this.prisma.communityGroup.findUnique({
      where: { id: groupId },
      select: { communityId: true },
    });
    if (!group || group.communityId !== communityId) throw new NotFoundException('Group not found');

    await this.requireCommunityRole(communityId, actorId, 'ADMIN');

    await this.prisma.communityGroup.delete({ where: { id: groupId } });
    return { message: 'Group deleted successfully' };
  }

  async addGroupMember(communityId: string, groupId: string, actorId: string, dto: AddGroupMemberDto) {
    const group = await this.prisma.communityGroup.findUnique({
      where: { id: groupId },
      select: { communityId: true },
    });
    if (!group || group.communityId !== communityId) throw new NotFoundException('Group not found');

    await this.requireGroupRole(groupId, actorId, 'MODERATOR');

    const isCommunityMember = await this.prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId, userId: dto.userId } },
    });
    if (!isCommunityMember) throw new ForbiddenException('Target user must be a community member first');

    const existing = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: dto.userId } },
    });
    if (existing) throw new ConflictException('User is already a group member');

    const member = await this.prisma.groupMember.create({
      data: { groupId, userId: dto.userId, role: 'MEMBER' },
      select: GROUP_MEMBER_SELECT,
    });

    return member;
  }

  async updateGroupMemberRole(
    communityId: string,
    groupId: string,
    actorId: string,
    targetUserId: string,
    dto: UpdateGroupMemberRoleDto,
  ) {
    const group = await this.prisma.communityGroup.findUnique({
      where: { id: groupId },
      select: { communityId: true },
    });
    if (!group || group.communityId !== communityId) throw new NotFoundException('Group not found');

    await this.requireGroupRole(groupId, actorId, 'MODERATOR');

    const targetMember = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: targetUserId } },
      select: { role: true },
    });
    if (!targetMember) throw new NotFoundException('Target user is not a group member');

    const hierarchy: Record<GroupMemberRole, number> = {
      MODERATOR: 2, MEMBER: 1,
    };

    const actorMember = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: actorId } },
      select: { role: true },
    });

    if (hierarchy[actorMember!.role] <= hierarchy[targetMember.role]) {
      throw new ForbiddenException('You cannot modify a user with equal or higher role');
    }

    const updated = await this.prisma.groupMember.update({
      where: { groupId_userId: { groupId, userId: targetUserId } },
      data: { role: dto.role },
      select: GROUP_MEMBER_SELECT,
    });

    return updated;
  }

  async removeGroupMember(communityId: string, groupId: string, actorId: string, targetUserId: string) {
    const group = await this.prisma.communityGroup.findUnique({
      where: { id: groupId },
      select: { communityId: true },
    });
    if (!group || group.communityId !== communityId) throw new NotFoundException('Group not found');

    await this.requireGroupRole(groupId, actorId, 'MODERATOR');

    const targetMember = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: targetUserId } },
      select: { role: true },
    });
    if (!targetMember) throw new NotFoundException('Target user is not a group member');

    const hierarchy: Record<GroupMemberRole, number> = {
      MODERATOR: 2, MEMBER: 1,
    };

    const actorMember = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: actorId } },
      select: { role: true },
    });

    if (hierarchy[actorMember!.role] <= hierarchy[targetMember.role]) {
      throw new ForbiddenException('You cannot remove a user with equal or higher role');
    }

    await this.prisma.groupMember.delete({
      where: { groupId_userId: { groupId, userId: targetUserId } },
    });

    return { message: 'Group member removed successfully' };
  }

  async findGroupMembers(communityId: string, groupId: string, role?: GroupMemberRole, page = 1, limit = 30) {
    const group = await this.prisma.communityGroup.findUnique({
      where: { id: groupId },
      select: { communityId: true },
    });
    if (!group || group.communityId !== communityId) throw new NotFoundException('Group not found');

    const skip = (page - 1) * limit;
    const where: any = { groupId };

    if (role) where.role = role;

    const [members, total] = await Promise.all([
      this.prisma.groupMember.findMany({
        where,
        skip,
        take: limit,
        orderBy: { joinedAt: 'asc' },
        select: GROUP_MEMBER_SELECT,
      }),
      this.prisma.groupMember.count({ where }),
    ]);

    return { members, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async joinGroup(communityId: string, groupId: string, userId: string) {
    const group = await this.prisma.communityGroup.findUnique({
      where: { id: groupId },
      select: { communityId: true },
    });
    if (!group || group.communityId !== communityId) throw new NotFoundException('Group not found');

    const isCommunityMember = await this.prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId, userId } },
    });
    if (!isCommunityMember) throw new ForbiddenException('You must be a community member to join groups');

    const existing = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (existing) throw new ConflictException('You are already a group member');

    const member = await this.prisma.groupMember.create({
      data: { groupId, userId, role: 'MEMBER' },
      select: GROUP_MEMBER_SELECT,
    });

    return member;
  }

  async leaveGroup(communityId: string, groupId: string, userId: string) {
    const group = await this.prisma.communityGroup.findUnique({
      where: { id: groupId },
      select: { communityId: true },
    });
    if (!group || group.communityId !== communityId) throw new NotFoundException('Group not found');

    const member = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!member) throw new NotFoundException('You are not a group member');

    await this.prisma.groupMember.delete({
      where: { groupId_userId: { groupId, userId } },
    });

    return { message: 'Left group successfully' };
  }

  private async requireCommunityRole(communityId: string, userId: string, minRole: CommunityMemberRole) {
    const member = await this.prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId, userId } },
      select: { role: true },
    });

    if (!member) throw new ForbiddenException('You are not a community member');

    const hierarchy: Record<CommunityMemberRole, number> = {
      OWNER: 4, ADMIN: 3, MODERATOR: 2, MEMBER: 1,
    };

    if (hierarchy[member.role] < hierarchy[minRole]) {
      throw new ForbiddenException(`Access denied. Required role: ${minRole} or higher`);
    }
  }

  private async requireGroupRole(groupId: string, userId: string, minRole: GroupMemberRole) {
    const member = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
      select: { role: true },
    });

    if (!member) throw new ForbiddenException('You are not a group member');

    const hierarchy: Record<GroupMemberRole, number> = {
      MODERATOR: 2, MEMBER: 1,
    };

    if (hierarchy[member.role] < hierarchy[minRole]) {
      throw new ForbiddenException(`Access denied. Required role: ${minRole} or higher`);
    }
  }
}
