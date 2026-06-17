import { SetMetadata } from '@nestjs/common';
import { CommunityMemberRole } from '@prisma/client';

export const COMMUNITY_ROLE_KEY = 'community_role';
export const CommunityRole = (...roles: CommunityMemberRole[]) =>
  SetMetadata(COMMUNITY_ROLE_KEY, roles);
