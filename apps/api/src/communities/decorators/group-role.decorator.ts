import { SetMetadata } from '@nestjs/common';
import { GroupMemberRole } from '@prisma/client';

export const GROUP_ROLE_KEY = 'group_role';
export const GroupRole = (...roles: GroupMemberRole[]) =>
  SetMetadata(GROUP_ROLE_KEY, roles);
