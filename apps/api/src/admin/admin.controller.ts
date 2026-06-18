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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { AdminService } from './admin.service';
import {
  CreateInstitutionDto,
  UpdateInstitutionDto,
  CreateDepartmentDto,
  UpdateDepartmentDto,
  CreateBannedWordDto,
  UpdateBannedWordDto,
  UpdateUserByAdminDto,
  AdminFlagUserDto,
  AdminFlagPostDto,
} from './dto';

@ApiTags('Admin')
@Controller('api/v1/admin')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
@Throttle({ long: { limit: 200, ttl: 60000 } })
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ─────────────── USERS ───────────────

  @Get('users')
  @ApiOperation({ summary: 'List all users (paginated, filterable)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'role', required: false })
  @ApiQuery({ name: 'status', required: false, description: 'active | deactivated' })
  async getUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.getUsers(
      Number(page) || 1,
      Number(limit) || 20,
      search,
      role,
      status,
    );
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user details by ID' })
  async getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Update user profile' })
  async updateUser(@Param('id') id: string, @Body() dto: UpdateUserByAdminDto) {
    return this.adminService.updateUser(id, dto);
  }

  @Post('users/:id/disable')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle disable/re-enable user account' })
  async disableUser(@Param('id') id: string) {
    return this.adminService.disableUser(id);
  }

  @Post('users/:id/flag')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Flag a user profile (creates a report)' })
  async flagUser(@Param('id') id: string, @Body() dto: AdminFlagUserDto, @Req() req: Request) {
    const adminId = (req as any).user.id;
    return this.adminService.flagUser(adminId, id, dto);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Permanently delete a user' })
  async deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  // ─────────────── INSTITUTIONS ───────────────

  @Get('institutions')
  @ApiOperation({ summary: 'List all institutions with department counts (admin)' })
  @ApiQuery({ name: 'type', required: false })
  async getInstitutions(@Query('type') type?: string) {
    return this.adminService.getInstitutions(type);
  }

  @Get('institutions/:id')
  @ApiOperation({ summary: 'Get institution with departments' })
  async getInstitutionById(@Param('id') id: string) {
    return this.adminService.getInstitutionById(id);
  }

  @Post('institutions')
  @ApiOperation({ summary: 'Create a new institution' })
  async createInstitution(@Body() dto: CreateInstitutionDto) {
    return this.adminService.createInstitution(dto);
  }

  @Patch('institutions/:id')
  @ApiOperation({ summary: 'Update an institution' })
  async updateInstitution(@Param('id') id: string, @Body() dto: UpdateInstitutionDto) {
    return this.adminService.updateInstitution(id, dto);
  }

  @Delete('institutions/:id')
  @ApiOperation({ summary: 'Delete an institution and its departments' })
  async deleteInstitution(@Param('id') id: string) {
    return this.adminService.deleteInstitution(id);
  }

  // ─────────────── DEPARTMENTS ───────────────

  @Post('institutions/:id/departments')
  @ApiOperation({ summary: 'Add a department to an institution' })
  async createDepartment(@Param('id') institutionId: string, @Body() dto: CreateDepartmentDto) {
    return this.adminService.createDepartment(institutionId, dto);
  }

  @Patch('departments/:id')
  @ApiOperation({ summary: 'Update a department' })
  async updateDepartment(@Param('id') id: string, @Body() dto: UpdateDepartmentDto) {
    return this.adminService.updateDepartment(id, dto);
  }

  @Delete('departments/:id')
  @ApiOperation({ summary: 'Delete a department' })
  async deleteDepartment(@Param('id') id: string) {
    return this.adminService.deleteDepartment(id);
  }

  // ─────────────── POSTS & COMMENTS ───────────────

  @Get('posts')
  @ApiOperation({ summary: 'List all posts (admin view with reports count)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false })
  async getPosts(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.getPosts(
      Number(page) || 1,
      Number(limit) || 20,
      search,
      status,
    );
  }

  @Delete('posts/:id')
  @ApiOperation({ summary: 'Delete any post' })
  async deletePost(@Param('id') id: string) {
    return this.adminService.deletePost(id);
  }

  @Post('posts/:id/flag')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Flag a post (set to draft + create report)' })
  async flagPost(@Param('id') id: string, @Body() dto: AdminFlagPostDto, @Req() req: Request) {
    const adminId = (req as any).user.id;
    return this.adminService.flagPost(id, adminId, dto);
  }

  @Post('posts/:id/unflag')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unflag a post (dismiss reports + publish)' })
  async unflagPost(@Param('id') id: string) {
    return this.adminService.unflagPost(id);
  }

  @Delete('comments/:id')
  @ApiOperation({ summary: 'Delete any comment' })
  async deleteComment(@Param('id') id: string) {
    return this.adminService.deleteComment(id);
  }

  // ─────────────── BANNED WORDS ───────────────

  @Get('banned-words')
  @ApiOperation({ summary: 'List all banned words/phrases' })
  async getBannedWords() {
    return this.adminService.getBannedWords();
  }

  @Post('banned-words')
  @ApiOperation({ summary: 'Add a banned word or phrase' })
  async createBannedWord(@Body() dto: CreateBannedWordDto) {
    return this.adminService.createBannedWord(dto);
  }

  @Patch('banned-words/:id')
  @ApiOperation({ summary: 'Update a banned word' })
  async updateBannedWord(@Param('id') id: string, @Body() dto: UpdateBannedWordDto) {
    return this.adminService.updateBannedWord(id, dto);
  }

  @Delete('banned-words/:id')
  @ApiOperation({ summary: 'Remove a banned word' })
  async deleteBannedWord(@Param('id') id: string) {
    return this.adminService.deleteBannedWord(id);
  }

  // ─────────────── ANALYTICS ───────────────

  @Get('analytics/overview')
  @ApiOperation({ summary: 'Platform-wide overview statistics' })
  async getAnalyticsOverview() {
    return this.adminService.getAnalyticsOverview();
  }

  @Get('analytics/users')
  @ApiOperation({ summary: 'User growth analytics' })
  @ApiQuery({ name: 'period', required: false, enum: ['7d', '30d', '90d'] })
  async getUserAnalytics(@Query('period') period?: '7d' | '30d' | '90d') {
    return this.adminService.getUserAnalytics(period || '30d');
  }

  @Get('analytics/posts')
  @ApiOperation({ summary: 'Post analytics' })
  @ApiQuery({ name: 'period', required: false, enum: ['7d', '30d', '90d'] })
  async getPostAnalytics(@Query('period') period?: '7d' | '30d' | '90d') {
    return this.adminService.getPostAnalytics(period || '30d');
  }

  @Get('analytics/engagement')
  @ApiOperation({ summary: 'Engagement analytics (comments, votes)' })
  @ApiQuery({ name: 'period', required: false, enum: ['7d', '30d', '90d'] })
  async getEngagementAnalytics(@Query('period') period?: '7d' | '30d' | '90d') {
    return this.adminService.getEngagementAnalytics(period || '30d');
  }
}
