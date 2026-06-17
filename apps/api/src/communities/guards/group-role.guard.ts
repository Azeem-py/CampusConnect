import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { GroupMemberRole } from '@prisma/client';
import { GROUP_ROLE_KEY } from '../decorators/group-role.decorator';

const ROLE_HIERARCHY: Record<GroupMemberRole, number> = {
  MODERATOR: 2,
  MEMBER: 1,
};

@Injectable()
export class GroupRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<GroupMemberRole[]>(
      GROUP_ROLE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const userId = (request as any).user?.id;
    const groupId = request.params.groupId;

    if (!groupId) {
      throw new NotFoundException('Group ID not found in route');
    }

    const member = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
      select: { role: true },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this group');
    }

    const userLevel = ROLE_HIERARCHY[member.role];
    const requiredLevel = Math.min(
      ...requiredRoles.map((r) => ROLE_HIERARCHY[r]),
    );

    if (userLevel < requiredLevel) {
      throw new ForbiddenException(
        `Access denied. Required role: ${requiredRoles.join(' or ')}`,
      );
    }

    return true;
  }
}
