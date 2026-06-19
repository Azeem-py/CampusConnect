import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

const TTL_S = 1800;

@Injectable()
export class InstitutionsService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async findAll(type?: string) {
    const cacheKey = type
      ? ['institutions', 'type', type]
      : ['institutions', 'all'];

    const cached = await this.redis.get<any[]>(...cacheKey);
    if (cached) return cached;

    const where = type ? { type: type as any } : {};
    const data = await this.prisma.institution.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    await this.redis.set(cacheKey, data, TTL_S);
    return data;
  }

  async findOne(id: string) {
    const cacheKey = ['institution', id];
    const cached = await this.redis.get<any>(...cacheKey);
    if (cached) return cached;

    const data = await this.prisma.institution.findUnique({
      where: { id },
      include: { departments: { orderBy: { name: 'asc' } } },
    });

    if (data) {
      await this.redis.set(cacheKey, data, TTL_S);
    }
    return data;
  }

  async getDepartments(institutionId: string) {
    const cacheKey = ['institution', institutionId, 'departments'];
    const cached = await this.redis.get<any[]>(...cacheKey);
    if (cached) return cached;

    const data = await this.prisma.department.findMany({
      where: { institutionId },
      orderBy: { name: 'asc' },
    });

    await this.redis.set(cacheKey, data, TTL_S);
    return data;
  }
}
