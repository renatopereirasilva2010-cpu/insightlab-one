import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SalesService } from '../src/modules/sales/sales.service';

describe('SalesService', () => {
  it('should be defined', () => {
    const service = new SalesService({} as any);
    expect(service).toBeDefined();
  });

  describe('addItem', () => {
    function buildAddItemPrismaMock(overrides: { sale?: any; professional?: any }) {
      const sale =
        overrides.sale === undefined
          ? { id: 'sale-1', tenantId: 't-1', status: 'OPEN', items: [], discountAmount: 0 }
          : overrides.sale;

      return {
        sale: {
          findFirst: jest.fn().mockResolvedValue(sale),
          update: jest.fn().mockImplementation(({ data }) => ({ ...sale, ...data })),
        },
        professional: {
          findFirst: jest.fn().mockResolvedValue(overrides.professional ?? null),
        },
        saleItem: {
          create: jest.fn().mockImplementation(({ data }) => ({ id: 'item-1', ...data })),
          findFirst: jest.fn(),
        },
      };
    }

    it('throws NotFoundException when the sale does not exist', async () => {
      const prisma = buildAddItemPrismaMock({ sale: null });
      const service = new SalesService(prisma as any);

      await expect(
        service.addItem('t-1', null, 'sale-x', {
          itemType: 'SERVICE',
          serviceId: 'svc-1',
          quantity: 1,
          unitPrice: 50,
        } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when professionalId is provided but does not belong to the tenant', async () => {
      const prisma = buildAddItemPrismaMock({ professional: null });
      const service = new SalesService(prisma as any);

      await expect(
        service.addItem('t-1', null, 'sale-1', {
          itemType: 'SERVICE',
          serviceId: 'svc-1',
          professionalId: 'prof-x',
          quantity: 1,
          unitPrice: 50,
        } as any),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.saleItem.create).not.toHaveBeenCalled();
    });

    it('creates the item carrying professionalId through when valid', async () => {
      const prisma = buildAddItemPrismaMock({ professional: { id: 'prof-1', tenantId: 't-1' } });
      const service = new SalesService(prisma as any);

      const item = await service.addItem('t-1', null, 'sale-1', {
        itemType: 'SERVICE',
        serviceId: 'svc-1',
        professionalId: 'prof-1',
        quantity: 1,
        unitPrice: 50,
      } as any);

      expect(item.professionalId).toBe('prof-1');
    });

    it('allows creating an item without professionalId (deferred to checkout gate)', async () => {
      const prisma = buildAddItemPrismaMock({});
      const service = new SalesService(prisma as any);

      const item = await service.addItem('t-1', null, 'sale-1', {
        itemType: 'SERVICE',
        serviceId: 'svc-1',
        quantity: 1,
        unitPrice: 50,
      } as any);

      expect(item.professionalId).toBeUndefined();
      expect(prisma.professional.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('readyForCheckout', () => {
    function buildCheckoutPrismaMock(sale: any) {
      return {
        sale: {
          findFirst: jest.fn().mockResolvedValue(sale),
          update: jest.fn().mockImplementation(({ data }) => ({ ...sale, ...data })),
        },
      };
    }

    it('throws BadRequestException when the sale has no items', async () => {
      const prisma = buildCheckoutPrismaMock({ id: 'sale-1', tenantId: 't-1', status: 'OPEN', items: [] });
      const service = new SalesService(prisma as any);

      await expect(service.readyForCheckout('t-1', 'sale-1')).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when a service item has no professional assigned', async () => {
      const prisma = buildCheckoutPrismaMock({
        id: 'sale-1',
        tenantId: 't-1',
        status: 'OPEN',
        items: [{ id: 'item-1', itemType: 'SERVICE', professionalId: null }],
      });
      const service = new SalesService(prisma as any);

      await expect(service.readyForCheckout('t-1', 'sale-1')).rejects.toThrow(BadRequestException);
      expect(prisma.sale.update).not.toHaveBeenCalled();
    });

    it('allows checkout when product items have no professional assigned', async () => {
      const prisma = buildCheckoutPrismaMock({
        id: 'sale-1',
        tenantId: 't-1',
        status: 'OPEN',
        items: [{ id: 'item-1', itemType: 'PRODUCT', professionalId: null }],
      });
      const service = new SalesService(prisma as any);

      const result = await service.readyForCheckout('t-1', 'sale-1');
      expect(result.status).toBe('READY_FOR_CHECKOUT');
    });

    it('allows checkout when every service item has a professional assigned', async () => {
      const prisma = buildCheckoutPrismaMock({
        id: 'sale-1',
        tenantId: 't-1',
        status: 'OPEN',
        items: [{ id: 'item-1', itemType: 'SERVICE', professionalId: 'prof-1' }],
      });
      const service = new SalesService(prisma as any);

      const result = await service.readyForCheckout('t-1', 'sale-1');
      expect(result.status).toBe('READY_FOR_CHECKOUT');
    });
  });
});
