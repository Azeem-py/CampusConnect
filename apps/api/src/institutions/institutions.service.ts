import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InstitutionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(type?: string) {
    const where = type ? { type: type as any } : {};
    return this.prisma.institution.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.institution.findUnique({
      where: { id },
      include: { departments: { orderBy: { name: 'asc' } } },
    });
  }

  async getDepartments(institutionId: string) {
    return this.prisma.department.findMany({
      where: { institutionId },
      orderBy: { name: 'asc' },
    });
  }
}
