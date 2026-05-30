import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpgradeBusinessDto } from '@campus-connect/types';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async upgradeToBusiness(userId: string, dto: UpgradeBusinessDto) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        include: { businessProfile: true }
      });

      if (!user) throw new BadRequestException('User not found');
      if (user.businessProfile) throw new BadRequestException('User already has a business profile');

      // Update user role and create business profile
      return tx.user.update({
        where: { id: userId },
        data: {
          role: 'BUSINESS',
          businessProfile: {
            create: dto
          }
        },
        include: { businessProfile: true }
      });
    });
  }

  async updateProfile(userId: string, dto: UpdateUserDto) {
    if (dto.username) {
      const existing = await this.prisma.user.findFirst({
        where: {
          username: dto.username,
          NOT: { id: userId },
        },
      });
      if (existing) {
        throw new BadRequestException('This username is already taken');
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
    });

    const { password: _, refreshTokenHash: __, ...userWithoutSensitive } = updatedUser;
    return userWithoutSensitive;
  }

  async followUser(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new BadRequestException('You cannot follow yourself');
    }

    // Check if user to follow exists
    const toFollow = await this.prisma.user.findUnique({
      where: { id: followingId }
    });
    if (!toFollow) {
      throw new BadRequestException('User to follow not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: followerId },
      data: {
        following: {
          connect: { id: followingId }
        }
      },
      include: {
        following: {
          select: { id: true }
        }
      }
    });

    const { password: _, refreshTokenHash: __, ...userWithoutSensitive } = updatedUser;
    return userWithoutSensitive;
  }

  async unfollowUser(followerId: string, followingId: string) {
    // Check if user to unfollow exists
    const toUnfollow = await this.prisma.user.findUnique({
      where: { id: followingId }
    });
    if (!toUnfollow) {
      throw new BadRequestException('User to unfollow not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: followerId },
      data: {
        following: {
          disconnect: { id: followingId }
        }
      },
      include: {
        following: {
          select: { id: true }
        }
      }
    });

    const { password: _, refreshTokenHash: __, ...userWithoutSensitive } = updatedUser;
    return userWithoutSensitive;
  }
}

