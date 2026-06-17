import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CommunitiesGroupsService } from './communities-groups.service';
import {
  CreateGroupDto,
  UpdateGroupDto,
  AddGroupMemberDto,
  UpdateGroupMemberRoleDto,
} from './dto';
import { GroupMemberRole } from '@prisma/client';

@ApiTags('Community Groups')
@Controller('api/v1/communities/:communityId/groups')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CommunitiesGroupsController {
  constructor(private readonly groupsService: CommunitiesGroupsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a group within a community (MOD+)' })
  async createGroup(
    @Param('communityId') communityId: string,
    @Body() dto: CreateGroupDto,
    @Req() req: Request,
  ) {
    const userId = (req as any).user.id;
    return this.groupsService.createGroup(communityId, userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List groups in a community' })
  async findGroups(@Param('communityId') communityId: string, @Req() req: Request) {
    const userId = (req as any).user.id;
    return this.groupsService.findGroups(communityId, userId);
  }

  @Get(':groupId')
  @ApiOperation({ summary: 'Get group details' })
  async findGroup(
    @Param('communityId') communityId: string,
    @Param('groupId') groupId: string,
    @Req() req: Request,
  ) {
    const userId = (req as any).user.id;
    return this.groupsService.findGroup(communityId, groupId, userId);
  }

  @Patch(':groupId')
  @ApiOperation({ summary: 'Update group settings (MOD+)' })
  async updateGroup(
    @Param('communityId') communityId: string,
    @Param('groupId') groupId: string,
    @Body() dto: UpdateGroupDto,
    @Req() req: Request,
  ) {
    const userId = (req as any).user.id;
    return this.groupsService.updateGroup(communityId, groupId, userId, dto);
  }

  @Delete(':groupId')
  @ApiOperation({ summary: 'Delete a group (ADMIN+)' })
  async deleteGroup(
    @Param('communityId') communityId: string,
    @Param('groupId') groupId: string,
    @Req() req: Request,
  ) {
    const userId = (req as any).user.id;
    return this.groupsService.deleteGroup(communityId, groupId, userId);
  }

  @Get(':groupId/members')
  @ApiOperation({ summary: 'List group members (paginated)' })
  @ApiQuery({ name: 'role', required: false, enum: GroupMemberRole })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 30 })
  async findGroupMembers(
    @Param('communityId') communityId: string,
    @Param('groupId') groupId: string,
    @Query('role') role?: GroupMemberRole,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.groupsService.findGroupMembers(
      communityId,
      groupId,
      role,
      Number(page) || 1,
      Number(limit) || 30,
    );
  }

  @Post(':groupId/members')
  @ApiOperation({ summary: 'Add a member to the group (Group MOD+)' })
  async addGroupMember(
    @Param('communityId') communityId: string,
    @Param('groupId') groupId: string,
    @Body() dto: AddGroupMemberDto,
    @Req() req: Request,
  ) {
    const userId = (req as any).user.id;
    return this.groupsService.addGroupMember(communityId, groupId, userId, dto);
  }

  @Patch(':groupId/members/:memberId')
  @ApiOperation({ summary: "Change a group member's role (Group MOD+)" })
  async updateGroupMemberRole(
    @Param('communityId') communityId: string,
    @Param('groupId') groupId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateGroupMemberRoleDto,
    @Req() req: Request,
  ) {
    const userId = (req as any).user.id;
    return this.groupsService.updateGroupMemberRole(communityId, groupId, userId, memberId, dto);
  }

  @Delete(':groupId/members/:memberId')
  @ApiOperation({ summary: 'Remove a member from the group (Group MOD+)' })
  async removeGroupMember(
    @Param('communityId') communityId: string,
    @Param('groupId') groupId: string,
    @Param('memberId') memberId: string,
    @Req() req: Request,
  ) {
    const userId = (req as any).user.id;
    return this.groupsService.removeGroupMember(communityId, groupId, userId, memberId);
  }

  @HttpCode(HttpStatus.OK)
  @Post(':groupId/join')
  @ApiOperation({ summary: 'Join a group' })
  async joinGroup(
    @Param('communityId') communityId: string,
    @Param('groupId') groupId: string,
    @Req() req: Request,
  ) {
    const userId = (req as any).user.id;
    return this.groupsService.joinGroup(communityId, groupId, userId);
  }

  @HttpCode(HttpStatus.OK)
  @Post(':groupId/leave')
  @ApiOperation({ summary: 'Leave a group' })
  async leaveGroup(
    @Param('communityId') communityId: string,
    @Param('groupId') groupId: string,
    @Req() req: Request,
  ) {
    const userId = (req as any).user.id;
    return this.groupsService.leaveGroup(communityId, groupId, userId);
  }
}
