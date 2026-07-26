import { NotFoundException } from '@nestjs/common';
import { ProductsService } from '../src/modules/products/products.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: {
    product: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };

  beforeEach(() => {
    prisma = {
      product: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    service = new ProductsService(prisma as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('findAllByTenant should query products by tenantId', async () => {
    const tenantId = 'tenant-1';
    const expected = [{ id: 'product-1', tenantId }];

    prisma.product.findMany.mockResolvedValue(expected);

    await expect(service.findAllByTenant(tenantId)).resolves.toEqual(expected);
    expect(prisma.product.findMany).toHaveBeenCalledWith({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('create should persist the minimum product payload', async () => {
    const tenantId = 'tenant-1';
    const unitId = 'unit-1';
    const dto = {
      name: 'Shampoo',
      sku: 'SH-001',
      salePrice: 49.9,
      cost: 22.5,
    };
    const created = { id: 'product-1', ...dto, tenantId, unitId };

    prisma.product.create.mockResolvedValue(created);

    await expect(service.create(tenantId, unitId, dto as any)).resolves.toEqual(created);
    expect(prisma.product.create).toHaveBeenCalledWith({
      data: {
        tenantId,
        unitId,
        name: dto.name,
        sku: dto.sku,
        salePrice: dto.salePrice,
        cost: dto.cost,
      },
    });
  });

  it('update should throw NotFoundException when the product does not belong to the tenant', async () => {
    prisma.product.findFirst.mockResolvedValue(null);

    await expect(
      service.update('tenant-1', 'product-x', { salePrice: 10 } as any),
    ).rejects.toThrow(NotFoundException);
    expect(prisma.product.update).not.toHaveBeenCalled();
  });

  it('update should persist the changed fields for a product scoped to the tenant', async () => {
    const existing = { id: 'product-1', tenantId: 'tenant-1', salePrice: 49.9 };
    const dto = { salePrice: 59.9, stockQuantity: 10, status: 'INACTIVE' };
    const updated = { ...existing, ...dto };

    prisma.product.findFirst.mockResolvedValue(existing);
    prisma.product.update.mockResolvedValue(updated);

    await expect(service.update('tenant-1', 'product-1', dto as any)).resolves.toEqual(updated);
    expect(prisma.product.findFirst).toHaveBeenCalledWith({
      where: { id: 'product-1', tenantId: 'tenant-1' },
    });
    expect(prisma.product.update).toHaveBeenCalledWith({
      where: { id: 'product-1' },
      data: {
        name: undefined,
        sku: undefined,
        salePrice: 59.9,
        cost: undefined,
        stockQuantity: 10,
        minStock: undefined,
        status: 'INACTIVE',
      },
    });
  });
});
