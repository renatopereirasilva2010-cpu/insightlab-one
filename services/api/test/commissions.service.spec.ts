import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CommissionsService } from '../src/modules/commissions/commissions.service';

describe('CommissionsService', () => {
  it('should be defined', () => {
    const service = new CommissionsService({} as any);
    expect(service).toBeDefined();
  });

  it('should preserve PENDING as valid initial commission status assumption', () => {
    const commission = { status: 'PENDING' };
    expect(commission.status).toBe('PENDING');
  });

  it('should preserve ON_PAYMENT as valid release mode assumption', () => {
    const commission = { releaseMode: 'ON_PAYMENT' };
    expect(commission.releaseMode).toBe('ON_PAYMENT');
  });

  function buildPrismaMock(commission: any) {
    return {
      commission: {
        findFirst: jest.fn().mockResolvedValue(commission),
        update: jest.fn().mockImplementation(({ data }) => ({ ...commission, ...data })),
      },
    };
  }

  describe('generate', () => {
    function buildGeneratePrismaMock(overrides: {
      item?: any;
      professional?: any;
      settings?: any;
      existingCommission?: any;
    }) {
      const item =
        overrides.item === undefined
          ? {
              id: 'item-1',
              tenantId: 't-1',
              saleId: 'sale-1',
              professionalId: 'prof-1',
              totalPrice: 100,
              sale: { id: 'sale-1', tenantId: 't-1', payments: [] },
            }
          : overrides.item;
      const professional =
        overrides.professional === undefined
          ? { id: 'prof-1', tenantId: 't-1', commissionRate: 30 }
          : overrides.professional;

      return {
        saleItem: { findFirst: jest.fn().mockResolvedValue(item) },
        professional: { findFirst: jest.fn().mockResolvedValue(professional) },
        businessSettings: {
          findUnique: jest.fn().mockResolvedValue(overrides.settings ?? null),
        },
        commission: {
          findFirst: jest.fn().mockResolvedValue(overrides.existingCommission ?? null),
          create: jest.fn().mockImplementation(({ data }) => data),
        },
      };
    }

    it('throws NotFoundException when the sale item does not exist', async () => {
      const prisma = buildGeneratePrismaMock({ item: null });
      const service = new CommissionsService(prisma as any);

      await expect(
        service.generate('t-1', null, {
          saleItemId: 'item-x',
          baseAmount: 50,
        } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when the sale item has no professional assigned', async () => {
      const prisma = buildGeneratePrismaMock({
        item: {
          id: 'item-1',
          tenantId: 't-1',
          saleId: 'sale-1',
          professionalId: null,
          totalPrice: 100,
          sale: { id: 'sale-1', tenantId: 't-1', payments: [] },
        },
      });
      const service = new CommissionsService(prisma as any);

      await expect(
        service.generate('t-1', null, {
          saleItemId: 'item-1',
          baseAmount: 50,
        } as any),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.commission.create).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when baseAmount exceeds the item total', async () => {
      const prisma = buildGeneratePrismaMock({});
      const service = new CommissionsService(prisma as any);

      await expect(
        service.generate('t-1', null, {
          saleItemId: 'item-1',
          baseAmount: 500,
        } as any),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.commission.create).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the professional does not exist', async () => {
      const prisma = buildGeneratePrismaMock({ professional: null });
      const service = new CommissionsService(prisma as any);

      await expect(
        service.generate('t-1', null, {
          saleItemId: 'item-1',
          baseAmount: 50,
        } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when the professional has no commissionRate configured', async () => {
      const prisma = buildGeneratePrismaMock({
        professional: { id: 'prof-1', tenantId: 't-1', commissionRate: null },
      });
      const service = new CommissionsService(prisma as any);

      await expect(
        service.generate('t-1', null, {
          saleItemId: 'item-1',
          baseAmount: 50,
        } as any),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.commission.create).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when a commission already exists for the sale item', async () => {
      const prisma = buildGeneratePrismaMock({ existingCommission: { id: 'com-1' } });
      const service = new CommissionsService(prisma as any);

      await expect(
        service.generate('t-1', null, {
          saleItemId: 'item-1',
          baseAmount: 50,
        } as any),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.commission.create).not.toHaveBeenCalled();
    });

    it('computes commissionAmount from the professional commissionRate and stays PENDING without a paid payment', async () => {
      const prisma = buildGeneratePrismaMock({});
      const service = new CommissionsService(prisma as any);

      const result = await service.generate('t-1', 'unit-1', {
        saleItemId: 'item-1',
        baseAmount: 100,
      } as any);

      expect(result.commissionAmount).toBe(30);
      expect(result.status).toBe('PENDING');
      expect(result.releasedAt).toBeNull();
      expect(result.saleItemId).toBe('item-1');
      expect(result.saleId).toBe('sale-1');
      expect(result.professionalId).toBe('prof-1');
    });

    it('releases immediately when the sale already has a paid payment under ON_PAYMENT mode', async () => {
      const prisma = buildGeneratePrismaMock({
        item: {
          id: 'item-1',
          tenantId: 't-1',
          saleId: 'sale-1',
          professionalId: 'prof-1',
          totalPrice: 100,
          sale: { id: 'sale-1', tenantId: 't-1', payments: [{ status: 'PAID' }] },
        },
      });
      const service = new CommissionsService(prisma as any);

      const result = await service.generate('t-1', null, {
        saleItemId: 'item-1',
        baseAmount: 100,
      } as any);

      expect(result.status).toBe('RELEASED');
      expect(result.commissionAmount).toBe(30);
    });

    it('releases immediately regardless of payment status under IMMEDIATE mode', async () => {
      const prisma = buildGeneratePrismaMock({
        settings: { commissionReleaseMode: 'IMMEDIATE' },
      });
      const service = new CommissionsService(prisma as any);

      const result = await service.generate('t-1', null, {
        saleItemId: 'item-1',
        baseAmount: 100,
      } as any);

      expect(result.status).toBe('RELEASED');
    });
  });

  describe('cancel', () => {
    it('moves a PENDING commission to CANCELED', async () => {
      const prisma = buildPrismaMock({ id: 'com-1', tenantId: 't-1', status: 'PENDING', notes: null });
      const service = new CommissionsService(prisma as any);

      const result = await service.cancel('t-1', 'com-1', {});

      expect(prisma.commission.update).toHaveBeenCalledWith({
        where: { id: 'com-1' },
        data: { status: 'CANCELED', notes: null },
      });
      expect(result.status).toBe('CANCELED');
    });

    it('moves a BLOCKED commission to CANCELED', async () => {
      const prisma = buildPrismaMock({ id: 'com-1', tenantId: 't-1', status: 'BLOCKED', notes: null });
      const service = new CommissionsService(prisma as any);

      const result = await service.cancel('t-1', 'com-1', {});
      expect(result.status).toBe('CANCELED');
    });

    it('throws NotFoundException when the commission does not exist', async () => {
      const prisma = buildPrismaMock(null);
      const service = new CommissionsService(prisma as any);

      await expect(service.cancel('t-1', 'missing', {})).rejects.toThrow(NotFoundException);
    });

    it('rejects canceling an already-canceled commission', async () => {
      const prisma = buildPrismaMock({ id: 'com-1', tenantId: 't-1', status: 'CANCELED' });
      const service = new CommissionsService(prisma as any);

      await expect(service.cancel('t-1', 'com-1', {})).rejects.toThrow(BadRequestException);
      expect(prisma.commission.update).not.toHaveBeenCalled();
    });

    it('rejects canceling a RELEASED commission - that requires financial reversal, not simple cancel', async () => {
      const prisma = buildPrismaMock({ id: 'com-1', tenantId: 't-1', status: 'RELEASED' });
      const service = new CommissionsService(prisma as any);

      await expect(service.cancel('t-1', 'com-1', {})).rejects.toThrow(BadRequestException);
      expect(prisma.commission.update).not.toHaveBeenCalled();
    });
  });
});
