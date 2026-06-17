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
import { CommunitiesService } from './communities.service';
import {
  CreateCommunityDto,
  UpdateCommunityDto,
  AddMemberDto,
  UpdateMemberRoleDto,
  HandleJoinRequestDto,
  TransferOwnershipDto,
} from './dto';
import { CommunityMemberRole } from '@prisma/client';
import { CommunityRole } from './decorators/community-role.decorator';
import { CommunityRoleGuard } from './guards/community-role.guard';

@ApiTags('Communities')
@Controller('api/v1/communities')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CommunitiesController {
  constructor(private readonly communitiesService: CommunitiesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new community (creator becomes OWNER)' })
  async create(@Body() dto: CreateCommunityDto, @Req() req: Request) {
    const userId = (req as any).user.id;
    return this.communitiesService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List communities (discoverable + user memberships)' })
  @ApiQuery({ name: 'institutionId', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  async findAll(
    @Req() req: Request,
    @Query('institutionId') institutionId?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = (req as any).user.id;
    return this.communitiesService.findAll(userId, institutionId, search, Number(page) || 1, Number(limit) || 20);
  }

  @Get('mine')
  @ApiOperation({ summary: 'List communities where the current user is a member' })
  async findMine(@Req() req: Request) {
    const userId = (req as any).user.id;
    return this.communitiesService.listMyCommunities(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get community details' })
  async findOne(@Param('id') id: string, @Req() req: Request) {
    const userId = (req as any).user.id;
    return this.communitiesService.findOne(id, userId);
  }

  @Patch(':id')
  @UseGuards(CommunityRoleGuard)
  @CommunityRole(CommunityMemberRole.ADMIN, CommunityMemberRole.OWNER)
  @ApiOperation({ summary: 'Update community settings (ADMIN+)' })
  async update(@Param('id') id: string, @Body() dto: UpdateCommunityDto, @Req() req: Request) {
    const userId = (req as any).user.id;
    return this.communitiesService.update(id, userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete community (OWNER only)' })
  async delete(@Param('id') id: string, @Req() req: Request) {
    const userId = (req as any).user.id;
    return this.communitiesService.delete(id, userId);
  }

  @Post(':id/transfer')
  @ApiOperation({ summary: 'Transfer ownership to another member (OWNER only)' })
  async transferOwnership(
    @Param('id') id: string,
    @Body() dto: TransferOwnershipDto,
    @Req() req: Request,
  ) {
    const userId = (req as any).user.id;
    return this.communitiesService.transferOwnership(id, userId, dto);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'List community members (paginated, filterable by role)' })
  @ApiQuery({ name: 'role', required: false, enum: CommunityMemberRole })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 30 })
  async findMembers(
    @Param('id') id: string,
    @Query('role') role?: CommunityMemberRole,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.communitiesService.findMembers(id, role, Number(page) || 1, Number(limit) || 30);
  }

  @Post(':id/members')
  @UseGuards(CommunityRoleGuard)
  @CommunityRole(CommunityMemberRole.ADMIN, CommunityMemberRole.OWNER)
  @ApiOperation({ summary: 'Add a member to the community (ADMIN+)' })
  async addMember(@Param('id') id: string, @Body() dto: AddMemberDto, @Req() req: Request) {
    const userId = (req as any).user.id;
    return this.communitiesService.addMember(id, userId, dto);
  }

  @Patch(':id/members/:memberId')
  @UseGuards(CommunityRoleGuard)
  @CommunityRole(CommunityMemberRole.ADMIN, CommunityMemberRole.OWNER)
  @ApiOperation({ summary: "Change a member's role (hierarchy-enforced)" })
  async updateMemberRole(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberRoleDto,
    @Req() req: Request,
  ) {
    const userId = (req as any).user.id;
    return this.communitiesService.updateMemberRole(id, userId, memberId, dto);
  }

  @Delete(':id/members/:memberId')
  @UseGuards(CommunityRoleGuard)
  @CommunityRole(CommunityMemberRole.ADMIN, CommunityMemberRole.OWNER)
  @ApiOperation({ summary: 'Remove a member from the community (hierarchy-enforced)' })
  async removeMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Req() req: Request,
  ) {
    const userId = (req as any).user.id;
    return this.communitiesService.removeMember(id, userId, memberId);
  }

  @HttpCode(HttpStatus.OK)
  @Post(':id/join')
  @ApiOperation({ summary: 'Join a community (handles OPEN/REQUEST/INVITE_ONLY flows)' })
  async join(@Param('id') id: string, @Req() req: Request) {
    const userId = (req as any).user.id;
    return this.communitiesService.joinCommunity(id, userId);
  }

  @HttpCode(HttpStatus.OK)
  @Post(':id/leave')
  @ApiOperation({ summary: 'Leave a community' })
  async leave(@Param('id') id: string, @Req() req: Request) {
    const userId = (req as any).user.id;
    return this.communitiesService.leaveCommunity(id, userId);
  }

  @Get(':id/requests')
  @UseGuards(CommunityRoleGuard)
  @CommunityRole(CommunityMemberRole.ADMIN, CommunityMemberRole.OWNER)
  @ApiOperation({ summary: 'List pending join requests (ADMIN+)' })
  async getJoinRequests(@Param('id') id: string, @Req() req: Request) {
    const userId = (req as any).user.id;
    return this.communitiesService.getJoinRequests(id, userId);
  }

  @Patch(':id/requests/:requestId')
  @UseGuards(CommunityRoleGuard)
  @CommunityRole(CommunityMemberRole.ADMIN, CommunityMemberRole.OWNER)
  @ApiOperation({ summary: 'Approve or decline a join request (ADMIN+)' })
  async handleJoinRequest(
    @Param('id') id: string,
    @Param('requestId') requestId: string,
    @Body() dto: HandleJoinRequestDto,
    @Req() req: Request,
  ) {
    const userId = (req as any).user.id;
    return this.communitiesService.handleJoinRequest(id, userId, requestId, dto);
  }
}
