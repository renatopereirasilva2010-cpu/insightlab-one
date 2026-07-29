import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { SuppliesService } from '../src/modules/supplies/supplies.service';
import { SupplyMovementTypeInput } from '../src/modules/supplies/dto/create-supply-movement.dto';

describe('SuppliesService', () => {
  const baseItem = {
    id: 'supply-1',
    tenantId: 'tenant-1',
    unitId: null,
    categoryId: null,
    name: 'Água oxigenada 30 vol',
    sku: null,
    description: null,
    baseUnit: 'ml',
    operationalUnit: 'un',
    unitCost: null,
    stockQuantity: new Prisma.Decimal(100),
    minStock: new Prisma.Decimal(20),
    status: 'ACTIVE',
  };

  function buildPrisma(overrides: Record<string, any> = {}) {
    return {
      supplyItem: {
        findFirst: jest.fn().mockResolvedValue(baseItem),
        findMany: jest.fn().mockResolvedValue([baseItem]),
        create: jest.fn().mockImplementation(({ data }) => ({ id: 'supply-1', ...data })),
        update: jest.fn().mockImplementation(({ data }) => ({ ...baseItem, ...data })),
      },
      supplyMovement: {
        create: jest
          .fn()
          .mockImplementation(({ data }) => ({ id: 'movement-1', createdAt: new Date(), ...data })),
        findMany: jest.fn().mockResolvedValue([]),
      },
      unitConversion: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      $transaction: jest.fn().mockImplementation((ops: Promise<unknown>[]) => Promise.all(ops)),
      ...overrides,
    };
  }

  it('should be defined', () => {
    const service = new SuppliesService(buildPrisma() as any);
    expect(service).toBeDefined();
  });

  describe('findAllByTenant', () => {
    it('queries supplies by tenantId', async () => {
      const prisma = buildPrisma();
      const service = new SuppliesService(prisma as any);

      await service.findAllByTenant('tenant-1');

      expect(prisma.supplyItem.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('create', () => {
    it('persists the minimum supply payload, defaulting initial stock to zero', async () => {
      const prisma = buildPrisma();
      const service = new SuppliesService(prisma as any);
      const dto = { name: 'Tintura Base', baseUnit: 'ml', operationalUnit: 'g', unitCost: 18.75 };

      await service.create('tenant-1', 'unit-1', dto as any);

      expect(prisma.supplyItem.create).toHaveBeenCalledWith({
        data: {
          tenantId: 'tenant-1',
          unitId: 'unit-1',
          name: dto.name,
          baseUnit: dto.baseUnit,
          operationalUnit: dto.operationalUnit,
          unitCost: dto.unitCost,
          stockQuantity: 0,
          minStock: undefined,
        },
      });
    });

    it('persists an informed initial stock and minimum stock', async () => {
      const prisma = buildPrisma();
      const service = new SuppliesService(prisma as any);
      const dto = { name: 'Tintura Base', baseUnit: 'ml', initialStock: 500, minStock: 100 };

      await service.create('tenant-1', null, dto as any);

      const call = prisma.supplyItem.create.mock.calls[0][0];
      expect(call.data.stockQuantity).toBe(500);
      expect(call.data.minStock).toBe(100);
    });
  });

  describe('update', () => {
    it('throws NotFoundException when the supply item does not exist for the tenant', async () => {
      const prisma = buildPrisma({ supplyItem: { findFirst: jest.fn().mockResolvedValue(null) } });
      const service = new SuppliesService(prisma as any);

      await expect(service.update('tenant-1', 'missing', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('registerMovement', () => {
    it('throws NotFoundException when the supply item does not exist for the tenant', async () => {
      const prisma = buildPrisma({ supplyItem: { findFirst: jest.fn().mockResolvedValue(null) } });
      const service = new SuppliesService(prisma as any);

      await expect(
        service.registerMovement('tenant-1', null, 'user-1', 'missing', {
          type: SupplyMovementTypeInput.ENTRY,
          quantity: 10,
          unit: 'ml',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('increases stock on an ENTRY movement in the base unit', async () => {
      const prisma = buildPrisma();
      const service = new SuppliesService(prisma as any);

      const result = await service.registerMovement('tenant-1', null, 'user-1', 'supply-1', {
        type: SupplyMovementTypeInput.ENTRY,
        quantity: 10,
        unit: 'ml',
      });

      expect(result.baseQuantity.toString()).toBe('10');
      const updateCall = prisma.supplyItem.update.mock.calls[0][0];
      expect(updateCall.data.stockQuantity.toString()).toBe('110');
    });

    it('converts quantity to the base unit using a registered UnitConversion before consuming stock', async () => {
      const prisma = buildPrisma({
        unitConversion: {
          findFirst: jest.fn().mockResolvedValue({ factor: new Prisma.Decimal(0.5) }),
        },
      });
      const service = new SuppliesService(prisma as any);

      await service.registerMovement('tenant-1', null, 'user-1', 'supply-1', {
        type: SupplyMovementTypeInput.SALE_CONSUMPTION,
        quantity: 4,
        unit: 'un',
      });

      const updateCall = prisma.supplyItem.update.mock.calls[0][0];
      // 4 un * 0.5 fator = 2 ml consumidos -> 100 - 2 = 98
      expect(updateCall.data.stockQuantity.toString()).toBe('98');
    });

    it('rejects a movement in a unit with no base-unit match and no registered conversion', async () => {
      const prisma = buildPrisma();
      const service = new SuppliesService(prisma as any);

      await expect(
        service.registerMovement('tenant-1', null, 'user-1', 'supply-1', {
          type: SupplyMovementTypeInput.ENTRY,
          quantity: 1,
          unit: 'kg',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects a negative quantity for a non-ADJUSTMENT movement', async () => {
      const prisma = buildPrisma();
      const service = new SuppliesService(prisma as any);

      await expect(
        service.registerMovement('tenant-1', null, 'user-1', 'supply-1', {
          type: SupplyMovementTypeInput.ENTRY,
          quantity: -5,
          unit: 'ml',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('allows a negative quantity for ADJUSTMENT and applies it as a signed delta', async () => {
      const prisma = buildPrisma();
      const service = new SuppliesService(prisma as any);

      await service.registerMovement('tenant-1', null, 'user-1', 'supply-1', {
        type: SupplyMovementTypeInput.ADJUSTMENT,
        quantity: -15,
        unit: 'ml',
      });

      const updateCall = prisma.supplyItem.update.mock.calls[0][0];
      expect(updateCall.data.stockQuantity.toString()).toBe('85');
    });

    it('rejects a consumption movement that would take stock negative', async () => {
      const prisma = buildPrisma();
      const service = new SuppliesService(prisma as any);

      await expect(
        service.registerMovement('tenant-1', null, 'user-1', 'supply-1', {
          type: SupplyMovementTypeInput.INTERNAL_USE,
          quantity: 500,
          unit: 'ml',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findLowStock', () => {
    it('returns only items where stock is at or below the minimum', async () => {
      const lowItem = { ...baseItem, id: 'supply-low', stockQuantity: new Prisma.Decimal(5) };
      const okItem = { ...baseItem, id: 'supply-ok', stockQuantity: new Prisma.Decimal(50) };
      const prisma = buildPrisma({
        supplyItem: {
          findMany: jest.fn().mockResolvedValue([lowItem, okItem]),
        },
      });
      const service = new SuppliesService(prisma as any);

      const result = await service.findLowStock('tenant-1');

      expect(result.map((i) => i.id)).toEqual(['supply-low']);
    });
  });
});
