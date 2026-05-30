import { Controller, Get, Patch, Post, Param, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiCookieAuth, ApiBody } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';

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
          select: { id: true },
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
}
