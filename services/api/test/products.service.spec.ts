import { ProductsService } from '../src/modules/products/products.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: {
    product: {
      findMany: jest.Mock;
      create: jest.Mock;
    };
  };

  beforeEach(() => {
    prisma = {
      product: {
        findMany: jest.fn(),
        create: jest.fn(),
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
});
