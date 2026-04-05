import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateUnitConversionDto } from './dto/create-unit-conversion.dto';

@Injectable()
export class UnitConversionsService {
  constructor(private readonly prisma: PrismaService) {}

  findAllByTenant(tenantId: string) {
    return this.prisma.unitConversion.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(tenantId: string, dto: CreateUnitConversionDto) {
    return this.prisma.unitConversion.create({
      data: {
        tenantId,
        supplyItemId: dto.supplyItemId,
        fromUnit: dto.fromUnit,
        toUnit: dto.toUnit,
        factor: dto.factor,
        roundingRule: dto.roundingRule,
      },
    });
  }
}
