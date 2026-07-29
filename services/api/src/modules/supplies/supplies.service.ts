import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, SupplyMovementType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateSupplyDto } from './dto/create-supply.dto';
import { UpdateSupplyDto } from './dto/update-supply.dto';
import { CreateSupplyMovementDto, SupplyMovementTypeInput } from './dto/create-supply-movement.dto';

/** Tipos de movimento cuja quantidade informada reduz o estoque (sinal negativo aplicado ao baseQuantity). */
const OUTBOUND_TYPES: SupplyMovementType[] = [
  SupplyMovementType.SALE_CONSUMPTION,
  SupplyMovementType.INTERNAL_USE,
];

@Injectable()
export class SuppliesService {
  constructor(private readonly prisma: PrismaService) {}

  findAllByTenant(tenantId: string) {
    return this.prisma.supplyItem.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findLowStock(tenantId: string) {
    const items = await this.prisma.supplyItem.findMany({
      where: { tenantId, stockQuantity: { not: null }, minStock: { not: null } },
      orderBy: { name: 'asc' },
    });
    return items.filter(
      (item) => item.stockQuantity !== null && item.minStock !== null && item.stockQuantity.lte(item.minStock),
    );
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
        stockQuantity: dto.initialStock ?? 0,
        minStock: dto.minStock,
      },
    });
  }

  async update(tenantId: string, supplyItemId: string, dto: UpdateSupplyDto) {
    const item = await this.findOwnedSupplyItem(tenantId, supplyItemId);

    return this.prisma.supplyItem.update({
      where: { id: item.id },
      data: {
        name: dto.name,
        baseUnit: dto.baseUnit,
        operationalUnit: dto.operationalUnit,
        unitCost: dto.unitCost,
        minStock: dto.minStock,
        status: dto.status,
      },
    });
  }

  async findMovements(tenantId: string, supplyItemId: string) {
    await this.findOwnedSupplyItem(tenantId, supplyItemId);

    return this.prisma.supplyMovement.findMany({
      where: { tenantId, supplyItemId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async registerMovement(
    tenantId: string,
    unitId: string | null,
    userId: string | null,
    supplyItemId: string,
    dto: CreateSupplyMovementDto,
  ) {
    const item = await this.findOwnedSupplyItem(tenantId, supplyItemId);
    const type = dto.type as unknown as SupplyMovementType;

    if (type !== SupplyMovementType.ADJUSTMENT && dto.quantity < 0) {
      throw new BadRequestException({
        code: 'SUPPLY_MOVEMENT_NEGATIVE_QUANTITY',
        title: 'Quantidade inválida',
        message: 'Apenas movimentos de ajuste podem ter quantidade negativa.',
        recommendedAction: 'Informe uma quantidade positiva ou use o tipo Ajuste.',
      });
    }

    const factor = await this.resolveConversionFactor(item, dto.unit);
    if (factor === null) {
      throw new BadRequestException({
        code: 'SUPPLY_UNIT_NOT_RECOGNIZED',
        title: 'Unidade não reconhecida',
        message: `A unidade "${dto.unit}" não corresponde à unidade base nem a uma conversão cadastrada para este insumo.`,
        recommendedAction: 'Cadastre a conversão de unidade antes de lançar o movimento, ou use a unidade base.',
      });
    }

    const magnitude = new Prisma.Decimal(dto.quantity).abs().times(factor);
    const signedBaseQuantity =
      type === SupplyMovementType.ADJUSTMENT
        ? new Prisma.Decimal(dto.quantity).times(factor)
        : OUTBOUND_TYPES.includes(type)
          ? magnitude.negated()
          : magnitude;

    const currentStock = item.stockQuantity ?? new Prisma.Decimal(0);
    const nextStock = currentStock.plus(signedBaseQuantity);

    if (nextStock.lessThan(0)) {
      throw new BadRequestException({
        code: 'SUPPLY_INSUFFICIENT_STOCK',
        title: 'Estoque insuficiente',
        message: `O saldo em estoque de "${item.name}" ficaria negativo com este movimento.`,
        recommendedAction: 'Revise a quantidade ou registre uma entrada antes de dar saída.',
      });
    }

    const [movement] = await this.prisma.$transaction([
      this.prisma.supplyMovement.create({
        data: {
          tenantId,
          unitId,
          supplyItemId: item.id,
          type,
          quantity: new Prisma.Decimal(dto.quantity).abs(),
          unit: dto.unit,
          baseQuantity: signedBaseQuantity,
          reason: dto.reason,
          referenceType: dto.referenceType,
          referenceId: dto.referenceId,
          performedByUserId: userId,
        },
      }),
      this.prisma.supplyItem.update({
        where: { id: item.id },
        data: { stockQuantity: nextStock },
      }),
    ]);

    return movement;
  }

  private async findOwnedSupplyItem(tenantId: string, supplyItemId: string) {
    const item = await this.prisma.supplyItem.findFirst({
      where: { id: supplyItemId, tenantId },
    });

    if (!item) {
      throw new NotFoundException({
        code: 'SUPPLY_ITEM_NOT_FOUND',
        title: 'Insumo não encontrado',
        message: 'Não encontramos o insumo informado para este tenant.',
        recommendedAction: 'Revise o insumo selecionado e tente novamente.',
      });
    }

    return item;
  }

  /** Retorna o fator multiplicativo pra converter `unit` para o baseUnit do insumo, ou null se a unidade não for reconhecida. */
  private async resolveConversionFactor(
    item: { id: string; baseUnit: string; operationalUnit: string | null },
    unit: string,
  ): Promise<Prisma.Decimal | null> {
    if (unit === item.baseUnit) {
      return new Prisma.Decimal(1);
    }

    const conversion = await this.prisma.unitConversion.findFirst({
      where: { supplyItemId: item.id, fromUnit: unit, toUnit: item.baseUnit, status: 'ACTIVE' },
    });

    return conversion ? conversion.factor : null;
  }
}
