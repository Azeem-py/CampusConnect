import {
  Controller,
  Post,
  Body,
  Res,
  Req,
  HttpCode,
  HttpStatus,
  ConflictException,
  UnauthorizedException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import type { Response, Request } from 'express';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SignupDto, LoginDto } from './dto';

@ApiTags('Auth')
@Controller('api/v1/auth')
export class AuthController {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
    @Inject(forwardRef(() => NotificationsService)) private notificationsService: NotificationsService,
    private jwtService: JwtService,
  ) {}

  private async generateTokens(userId: string, email: string) {
    const accessToken = this.jwtService.sign(
      { sub: userId, email },
      { expiresIn: '15m' },
    );

    const refreshToken = this.jwtService.sign(
      { sub: userId, type: 'refresh' },
      { expiresIn: '7d' },
    );

    const refreshTokenHash = await bcrypt.hash(refreshToken, 12);

    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash },
    });

    return { accessToken, refreshToken };
  }

  private setTokenCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ) {
    res.cookie('token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 min
      path: '/',
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });
  }

  private clearTokenCookies(res: Response) {
    res.clearCookie('token', { path: '/' });
    res.clearCookie('refreshToken', { path: '/' });
  }

  @Post('signup')
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiBody({
    type: SignupDto,
    examples: {
      'Student Signup': {
        value: {
          name: 'Alex Rivera',
          username: '@alex_rivera',
          email: 'alex@mit.edu',
          phone: '+1 (555) 123-4567',
          department: 'comp-sci',
          school: 'mit',
          interests: 'Machine Learning, Quantum Physics',
          hobby: 'Photography',
          password: 'secureP@ss123',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully. Access + refresh tokens set in httpOnly cookies.',
    schema: {
      example: {
        user: {
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
          reputationScore: 0,
          createdAt: '2026-05-17T12:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({ status: 409, description: 'Email or username already exists' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async signup(@Body() dto: SignupDto, @Res({ passthrough: true }) res: Response) {
    this.authService.validateRegistration(dto.email, 'STUDENT');

    const existingEmail = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingEmail) {
      throw new ConflictException('An account with this email already exists');
    }

    const existingUsername = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });
    if (existingUsername) {
      throw new ConflictException('This username is already taken');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        username: dto.username,
        email: dto.email,
        password: hashedPassword,
        phone: dto.phone ?? null,
        department: dto.department ?? null,
        school: dto.school ?? null,
        interests: dto.interests ?? null,
        hobby: dto.hobby ?? null,
        avatar: dto.avatar ?? null,
        banner: dto.banner ?? null,
      },
    });

    await this.notificationsService.seedDefaultPreferences(user.id);

    const { accessToken, refreshToken } = await this.generateTokens(user.id, user.email);
    this.setTokenCookies(res, accessToken, refreshToken);

    const { password: _, refreshTokenHash: __, ...userWithoutPassword } = user;
    return { user: userWithoutPassword };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in with email and password' })
  @ApiBody({
    type: LoginDto,
    examples: {
      'User Login': {
        value: { email: 'alex@mit.edu', password: 'secureP@ss123' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful. Access + refresh tokens set in httpOnly cookies.',
    schema: {
      example: {
        user: {
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
          reputationScore: 0,
          createdAt: '2026-05-17T12:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid email or password' })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.isDeactivated) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { isDeactivated: false },
      });
      user.isDeactivated = false;
    }

    const { accessToken, refreshToken } = await this.generateTokens(user.id, user.email);
    this.setTokenCookies(res, accessToken, refreshToken);

    const { password: _, refreshTokenHash: __, ...userWithoutPassword } = user;
    return { user: userWithoutPassword };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using the refresh token cookie' })
  @ApiResponse({
    status: 200,
    description: 'Tokens refreshed successfully.',
    schema: {
      example: {
        user: {
          id: 'clxyzabc123def456',
          name: 'Alex Rivera',
          username: '@alex_rivera',
          email: 'alex@mit.edu',
          role: 'STUDENT',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshTokenCookie = req.cookies?.refreshToken;
    if (!refreshTokenCookie) {
      throw new UnauthorizedException('Refresh token not found');
    }

    let payload: { sub: string; type: string };
    try {
      payload = this.jwtService.verify(refreshTokenCookie);
    } catch {
      this.clearTokenCookies(res);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (payload.type !== 'refresh') {
      this.clearTokenCookies(res);
      throw new UnauthorizedException('Invalid token type');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.refreshTokenHash) {
      this.clearTokenCookies(res);
      throw new UnauthorizedException('User not found or session revoked');
    }

    const isValidHash = await bcrypt.compare(refreshTokenCookie, user.refreshTokenHash);
    if (!isValidHash) {
      this.clearTokenCookies(res);
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    const { accessToken, refreshToken } = await this.generateTokens(user.id, user.email);
    this.setTokenCookies(res, accessToken, refreshToken);

    const { password: _, refreshTokenHash: __, ...userWithoutPassword } = user;
    return { user: userWithoutPassword };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign out and clear all auth cookies' })
  @ApiResponse({ status: 200, description: 'Logged out successfully. Tokens revoked.' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshTokenCookie = req.cookies?.refreshToken;
    if (refreshTokenCookie) {
      try {
        const payload = this.jwtService.verify(refreshTokenCookie) as { sub: string };
        await this.prisma.user.update({
          where: { id: payload.sub },
          data: { refreshTokenHash: null },
        });
      } catch {
        // Token already expired or invalid — still clear cookies
      }
    }

    this.clearTokenCookies(res);
    return { message: 'Logged out successfully' };
  }
}
