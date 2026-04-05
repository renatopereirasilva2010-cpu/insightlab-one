import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  findAllByTenant(tenantId: string) {
    return this.prisma.product.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(tenantId: string, unitId: string | null, dto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        tenantId,
        unitId,
        name: dto.name,
        sku: dto.sku,
        salePrice: dto.salePrice,
        cost: dto.cost,
      },
    });
  }
}
