import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByTenant(tenantId: string) {
    return this.prisma.role.findMany({
      where: { tenantId },
      select: { id: true, code: true, name: true, description: true },
      orderBy: { name: 'asc' },
    });
  }
}
