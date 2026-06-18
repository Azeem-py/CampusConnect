import { Injectable, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { NOTIFICATION_EVENT } from '../notifications/notification-listener.service';
import { UpgradeBusinessDto } from '@campus-connect/types';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePasswordDto, UpdateEmailDto, UpdatePreferencesDto } from './dto/update-settings.dto';
import { InteractionMatrixService } from '../recommendations/interaction-matrix.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private readonly matrixService: InteractionMatrixService,
    private eventEmitter: EventEmitter2,
  ) {}

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
          select: {
            id: true,
          },
        },
        _count: {
          select: {
            followers: true,
            following: true,
          },
        },
      }
    });

    await this.eventEmitter.emitAsync(NOTIFICATION_EVENT, {
      recipientId: followingId,
      type: 'FOLLOW',
      actorId: followerId,
      metadata: {},
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
          select: {
            id: true,
          },
        },
        _count: {
          select: {
            followers: true,
            following: true,
          },
        },
      }
    });

    const { password: _, refreshTokenHash: __, ...userWithoutSensitive } = updatedUser;
    return userWithoutSensitive;
  }

  async findFollowers(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [followers, total] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          following: {
            some: { id: userId }
          },
          isDeactivated: false,
        },
        select: {
          id: true,
          name: true,
          username: true,
          avatar: true,
          school: true,
          department: true,
          major: true,
        },
        skip,
        take: limit,
      }),
      this.prisma.user.count({
        where: {
          following: {
            some: { id: userId }
          },
          isDeactivated: false,
        }
      })
    ]);

    const totalPages = Math.ceil(total / limit);
    return { followers, total, page, limit, totalPages };
  }

  async findFollowing(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [following, total] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          followers: {
            some: { id: userId }
          },
          isDeactivated: false,
        },
        select: {
          id: true,
          name: true,
          username: true,
          avatar: true,
          school: true,
          department: true,
          major: true,
        },
        skip,
        take: limit,
      }),
      this.prisma.user.count({
        where: {
          followers: {
            some: { id: userId }
          },
          isDeactivated: false,
        }
      })
    ]);

    const totalPages = Math.ceil(total / limit);
    return { following, total, page, limit, totalPages };
  }

  async getSuggestedScholars(userId: string) {
    // 1. Fetch target user details
    const targetUser = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        following: {
          select: { id: true },
        },
      },
    });

    if (!targetUser) return [];

    // Extract following IDs
    const followedIds = new Set(targetUser.following.map((f) => f.id));

    // 2. Fetch all other active users in the system (excluding current user and already followed users)
    const candidates = await this.prisma.user.findMany({
      where: {
        id: {
          notIn: [userId, ...Array.from(followedIds)],
        },
        isDeactivated: false,
      },
      select: {
        id: true,
        name: true,
        username: true,
        avatar: true,
        department: true,
        major: true,
        school: true,
        interests: true,
        hobby: true,
        reputationScore: true,
      },
      orderBy: {
        reputationScore: 'desc',
      },
      take: 100,
    });

    if (candidates.length === 0) return [];

    // 3. Fetch sparse interaction matrix
    let matrix;
    try {
      matrix = await this.matrixService.getMatrix();
    } catch (err) {
      matrix = new Map();
    }

    const userVec = matrix.get(userId);

    // 4. Scoring logic
    const scoredScholars = candidates.map((candidate) => {
      // (a) Interests & Hobby similarity (Jaccard Similarity)
      const parseTags = (str: string | null): string[] => {
        if (!str) return [];
        return str
          .toLowerCase()
          .split(',')
          .map((t) => t.trim())
          .filter((t) => t.length > 0);
      };

      const interestsA = parseTags(targetUser.interests);
      const interestsC = parseTags(candidate.interests);
      const hobbiesA = parseTags(targetUser.hobby);
      const hobbiesC = parseTags(candidate.hobby);

      const jaccard = (setA: string[], setB: string[]): number => {
        if (setA.length === 0 || setB.length === 0) return 0;
        const sA = new Set(setA);
        const sB = new Set(setB);
        const intersect = new Set([...sA].filter((x) => sB.has(x)));
        const union = new Set([...sA, ...sB]);
        return intersect.size / union.size;
      };

      const jaccardInterests = jaccard(interestsA, interestsC);
      const jaccardHobbies = jaccard(hobbiesA, hobbiesC);
      const interestsSim = 0.7 * jaccardInterests + 0.3 * jaccardHobbies;

      // (b) Activity similarity (Cosine Similarity of post interaction vectors)
      let activitySim = 0;
      const candidateVec = matrix.get(candidate.id);
      if (userVec && candidateVec && userVec.size > 0 && candidateVec.size > 0) {
        let dot = 0;
        let normA = 0;
        let normB = 0;

        // Iterate the smaller vector to minimize operations
        const [small, large] = userVec.size <= candidateVec.size ? [userVec, candidateVec] : [candidateVec, userVec];
        small.forEach((w: number, term: string) => {
          dot += w * (large.get(term) ?? 0);
        });
        userVec.forEach((w: number) => (normA += w * w));
        candidateVec.forEach((w: number) => (normB += w * w));

        const denom = Math.sqrt(normA) * Math.sqrt(normB);
        activitySim = denom === 0 ? 0 : dot / denom;
        activitySim = Math.max(0, activitySim);
      }

      // (c) Academic context matches
      let contextSim = 0;
      if (targetUser.department && candidate.department && targetUser.department === candidate.department) {
        contextSim += 0.2;
      }
      if (targetUser.major && candidate.major && targetUser.major === candidate.major) {
        contextSim += 0.2;
      }
      if (targetUser.school && candidate.school && targetUser.school === candidate.school) {
        contextSim += 0.1;
      }

      // (d) Reputation Popularity boost
      const popularitySim = Math.tanh(candidate.reputationScore / 100) * 0.1;

      // (e) Composite score
      // Weights: 40% Interests, 40% Activity, 10% Academic Context, 10% Reputation Popularity
      const compositeScore = 0.4 * interestsSim + 0.4 * activitySim + 0.1 * contextSim + 0.1 * popularitySim;

      // Fallback display title / department info
      let displayTitle = 'Scholar';
      if (candidate.major) {
        displayTitle = candidate.major;
      } else if (candidate.department) {
        displayTitle = candidate.department;
      }

      return {
        id: candidate.id,
        name: candidate.name || candidate.username,
        username: candidate.username,
        title: displayTitle,
        avatar: candidate.avatar || undefined,
        score: compositeScore,
      };
    });

    // 5. Sort by score in descending order and limit to top 5
    scoredScholars.sort((a, b) => b.score - a.score);

    return scoredScholars.slice(0, 5).map(({ score: _, ...rest }) => rest);
  }

  async searchScholars(query: string) {
    const clean = query.trim();
    if (!clean) return [];
    return this.prisma.user.findMany({
      where: {
        isDeactivated: false,
        OR: [
          { name: { contains: clean, mode: 'insensitive' } },
          { username: { contains: clean, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        username: true,
        avatar: true,
        department: true,
        major: true,
      },
      take: 10,
    });
  }

  async updatePassword(userId: string, dto: UpdatePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new BadRequestException('User not found');

    const isPasswordValid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Password updated successfully' };
  }

  async updateEmail(userId: string, dto: UpdateEmailDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new BadRequestException('User not found');

    const isPasswordValid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing && existing.id !== userId) {
      throw new BadRequestException('An account with this email already exists');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { email: dto.email },
    });

    const { password: _, refreshTokenHash: __, ...userWithoutSensitive } = updatedUser;
    return userWithoutSensitive;
  }

  async updatePreferences(userId: string, dto: UpdatePreferencesDto) {
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
    });

    const { password: _, refreshTokenHash: __, ...userWithoutSensitive } = updatedUser;
    return userWithoutSensitive;
  }

  async deactivateAccount(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isDeactivated: true,
        refreshTokenHash: null,
      },
    });

    return { message: 'Account deactivated successfully' };
  }
}

