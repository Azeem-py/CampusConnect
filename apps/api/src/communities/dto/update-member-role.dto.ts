import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CommunityMemberRole } from '@prisma/client';

export class UpdateMemberRoleDto {
  @ApiProperty({ enum: CommunityMemberRole })
  @IsEnum(CommunityMemberRole)
  role!: CommunityMemberRole;
}
