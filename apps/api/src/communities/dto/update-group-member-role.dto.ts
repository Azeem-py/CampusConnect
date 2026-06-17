import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { GroupMemberRole } from '@prisma/client';

export class UpdateGroupMemberRoleDto {
  @ApiProperty({ enum: GroupMemberRole })
  @IsEnum(GroupMemberRole)
  role!: GroupMemberRole;
}
