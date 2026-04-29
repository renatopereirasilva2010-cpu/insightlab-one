import { SuppliesService } from '../src/modules/supplies/supplies.service';

describe('SuppliesService', () => {
  let service: SuppliesService;
  let prisma: {
    supplyItem: {
      findMany: jest.Mock;
      create: jest.Mock;
    };
  };

  beforeEach(() => {
    prisma = {
      supplyItem: {
        findMany: jest.fn(),
        create: jest.fn(),
      },
    };

    service = new SuppliesService(prisma as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('findAllByTenant should query supplies by tenantId', async () => {
    const tenantId = 'tenant-1';
    const expected = [{ id: 'supply-1', tenantId }];

    prisma.supplyItem.findMany.mockResolvedValue(expected);

    await expect(service.findAllByTenant(tenantId)).resolves.toEqual(expected);
    expect(prisma.supplyItem.findMany).toHaveBeenCalledWith({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('create should persist the minimum supply payload', async () => {
    const tenantId = 'tenant-1';
    const unitId = 'unit-1';
    const dto = {
      name: 'Tintura Base',
      baseUnit: 'ml',
      operationalUnit: 'g',
      unitCost: 18.75,
    };
    const created = { id: 'supply-1', ...dto, tenantId, unitId };

    prisma.supplyItem.create.mockResolvedValue(created);

    await expect(service.create(tenantId, unitId, dto as any)).resolves.toEqual(created);
    expect(prisma.supplyItem.create).toHaveBeenCalledWith({
      data: {
        tenantId,
        unitId,
        name: dto.name,
        baseUnit: dto.baseUnit,
        operationalUnit: dto.operationalUnit,
        unitCost: dto.unitCost,
      },
    });
  });
});
