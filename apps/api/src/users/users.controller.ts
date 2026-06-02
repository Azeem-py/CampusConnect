import { Controller, Get, Patch, Post, Param, Body, Query, Req, Res, UseGuards, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiCookieAuth, ApiBody } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePasswordDto, UpdateEmailDto, UpdatePreferencesDto } from './dto/update-settings.dto';

@ApiTags('Users')
@Controller('api/v1/users')
export class UsersController {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
  ) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get the currently authenticated user' })
  @ApiCookieAuth('token')
  @ApiResponse({
    status: 200,
    description: 'Current user data (password and refreshTokenHash excluded)',
    schema: {
      example: {
        id: 'clxyzabc123def456',
        name: 'Alex Rivera',
        username: '@alex_rivera',
        email: 'alex@mit.edu',
        role: 'STUDENT',
        phone: '+1 (555) 123-4567',
        department: 'comp-sci',
        school: 'mit',
        interests: 'Machine Learning, Quantum Physics',
        hobby: 'Photography',
        avatar: null,
        banner: null,
        bio: null,
        major: null,
        graduationYear: null,
        reputationScore: 0,
        createdAt: '2026-05-17T12:00:00.000Z',
        updatedAt: '2026-05-17T12:00:00.000Z',
        following: [{ id: 'clxyzabc123def456' }],
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized — missing or invalid token' })
  async getMe(@Req() req: Request) {
    const userId = (req as any).user.id;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        following: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            school: true,
            department: true,
            major: true,
          },
        },
        followers: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            school: true,
            department: true,
            major: true,
          },
        },
      },
    });

    const { password: _, refreshTokenHash: __, ...userWithoutSensitive } = user!;
    return userWithoutSensitive;
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiCookieAuth('token')
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation error or username taken' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateMe(@Body() dto: UpdateUserDto, @Req() req: Request) {
    const userId = (req as any).user.id;
    return this.usersService.updateProfile(userId, dto);
  }

  @Post(':id/follow')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Follow a user' })
  @ApiCookieAuth('token')
  @ApiResponse({ status: 200, description: 'Successfully followed the user' })
  @ApiResponse({ status: 400, description: 'Cannot follow yourself or user not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async followUser(@Param('id') followingId: string, @Req() req: Request) {
    const followerId = (req as any).user.id;
    return this.usersService.followUser(followerId, followingId);
  }

  @Post(':id/unfollow')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Unfollow a user' })
  @ApiCookieAuth('token')
  @ApiResponse({ status: 200, description: 'Successfully unfollowed the user' })
  @ApiResponse({ status: 400, description: 'User not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async unfollowUser(@Param('id') followingId: string, @Req() req: Request) {
    const followerId = (req as any).user.id;
    return this.usersService.unfollowUser(followerId, followingId);
  }

  @Get('suggested')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get statistically suggested scholars similar to the current user' })
  @ApiCookieAuth('token')
  @ApiResponse({ status: 200, description: 'Suggested scholars retrieved successfully' })
  async getSuggestedScholars(@Req() req: Request) {
    const userId = (req as any).user.id;
    return this.usersService.getSuggestedScholars(userId);
  }

  @Get('search')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Search scholars by name or username for mentions' })
  @ApiCookieAuth('token')
  @ApiResponse({ status: 200, description: 'Matching scholars list retrieved successfully' })
  async searchScholars(@Query('q') q: string) {
    return this.usersService.searchScholars(q || '');
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get a user profile by ID' })
  @ApiCookieAuth('token')
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserById(@Param('id') id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        following: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            school: true,
            department: true,
            major: true,
          },
        },
        followers: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            school: true,
            department: true,
            major: true,
          },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');
    const { password: _, refreshTokenHash: __, ...userWithoutSensitive } = user;
    return userWithoutSensitive;
  }

  @Patch('me/password')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Change current user password' })
  @ApiCookieAuth('token')
  @ApiBody({ type: UpdatePasswordDto })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Incorrect current password or invalid new password' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updatePassword(@Body() dto: UpdatePasswordDto, @Req() req: Request) {
    const userId = (req as any).user.id;
    return this.usersService.updatePassword(userId, dto);
  }

  @Patch('me/email')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Change current user email address' })
  @ApiCookieAuth('token')
  @ApiBody({ type: UpdateEmailDto })
  @ApiResponse({ status: 200, description: 'Email updated successfully' })
  @ApiResponse({ status: 400, description: 'Incorrect password or email already taken' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateEmail(@Body() dto: UpdateEmailDto, @Req() req: Request) {
    const userId = (req as any).user.id;
    return this.usersService.updateEmail(userId, dto);
  }

  @Patch('me/preferences')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update notification and privacy preferences' })
  @ApiCookieAuth('token')
  @ApiBody({ type: UpdatePreferencesDto })
  @ApiResponse({ status: 200, description: 'Preferences updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updatePreferences(@Body() dto: UpdatePreferencesDto, @Req() req: Request) {
    const userId = (req as any).user.id;
    return this.usersService.updatePreferences(userId, dto);
  }

  @Post('me/deactivate')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Deactivate current user account' })
  @ApiCookieAuth('token')
  @ApiResponse({ status: 200, description: 'Account deactivated successfully. Tokens cleared.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deactivateAccount(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const userId = (req as any).user.id;
    const result = await this.usersService.deactivateAccount(userId);
    res.clearCookie('token', { path: '/' });
    res.clearCookie('refreshToken', { path: '/' });
    return result;
  }
}
