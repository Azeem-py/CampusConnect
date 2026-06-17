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
import { CommunityMemberRole } from '@prisma/client';
import { COMMUNITY_ROLE_KEY } from '../decorators/community-role.decorator';

const ROLE_HIERARCHY: Record<CommunityMemberRole, number> = {
  OWNER: 4,
  ADMIN: 3,
  MODERATOR: 2,
  MEMBER: 1,
};

@Injectable()
export class CommunityRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<CommunityMemberRole[]>(
      COMMUNITY_ROLE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const userId = (request as any).user?.id;
    const communityId = request.params.communityId ?? request.params.id;

    if (!communityId) {
      throw new NotFoundException('Community ID not found in route');
    }

    const member = await this.prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId, userId } },
      select: { role: true },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this community');
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
