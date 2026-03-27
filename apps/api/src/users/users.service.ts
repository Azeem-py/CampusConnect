import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpgradeBusinessDto } from '@campus-connect/types';

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
}
