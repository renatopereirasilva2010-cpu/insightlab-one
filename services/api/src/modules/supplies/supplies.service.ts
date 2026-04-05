import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateSupplyDto } from './dto/create-supply.dto';

@Injectable()
export class SuppliesService {
  constructor(private readonly prisma: PrismaService) {}

  findAllByTenant(tenantId: string) {
    return this.prisma.supplyItem.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(tenantId: string, unitId: string | null, dto: CreateSupplyDto) {
    return this.prisma.supplyItem.create({
      data: {
        tenantId,
        unitId,
        name: dto.name,
        baseUnit: dto.baseUnit,
        operationalUnit: dto.operationalUnit,
        unitCost: dto.unitCost,
      },
    });
  }
}
