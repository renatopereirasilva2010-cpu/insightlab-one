import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateResourceDto } from './dto/create-resource.dto';

@Injectable()
export class ResourcesService {
  constructor(private readonly prisma: PrismaService) {}

  findAllByTenant(tenantId: string) {
    return this.prisma.operationalResource.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(tenantId: string, unitId: string | null, dto: CreateResourceDto) {
    return this.prisma.operationalResource.create({
      data: {
        tenantId,
        unitId,
        name: dto.name,
        type: dto.type,
        description: dto.description,
      },
    });
  }
}
