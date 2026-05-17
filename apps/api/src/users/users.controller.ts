import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiCookieAuth } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Users')
@Controller('api/v1/users')
export class UsersController {
  constructor(private prisma: PrismaService) {}

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
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized — missing or invalid token' })
  async getMe(@Req() req: Request) {
    const userId = (req as any).user.id;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    const { password: _, refreshTokenHash: __, ...userWithoutSensitive } = user!;
    return userWithoutSensitive;
  }
}
