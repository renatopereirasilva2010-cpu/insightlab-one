import { UnitConversionsService } from '../src/modules/unit-conversions/unit-conversions.service';

describe('UnitConversionsService', () => {
  let service: UnitConversionsService;
  let prisma: {
    unitConversion: {
      findMany: jest.Mock;
      create: jest.Mock;
    };
  };

  beforeEach(() => {
    prisma = {
      unitConversion: {
        findMany: jest.fn(),
        create: jest.fn(),
      },
    };

    service = new UnitConversionsService(prisma as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('findAllByTenant should query unit conversions by tenantId', async () => {
    const tenantId = 'tenant-1';
    const expected = [{ id: 'conversion-1', tenantId }];

    prisma.unitConversion.findMany.mockResolvedValue(expected);

    await expect(service.findAllByTenant(tenantId)).resolves.toEqual(expected);
    expect(prisma.unitConversion.findMany).toHaveBeenCalledWith({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('create should persist the minimum unit conversion payload', async () => {
    const tenantId = 'tenant-1';
    const dto = {
      supplyItemId: 'supply-1',
      fromUnit: 'box',
      toUnit: 'unit',
      factor: 12,
      roundingRule: 'NONE',
    };
    const created = { id: 'conversion-1', ...dto, tenantId };

    prisma.unitConversion.create.mockResolvedValue(created);

    await expect(service.create(tenantId, dto as any)).resolves.toEqual(created);
    expect(prisma.unitConversion.create).toHaveBeenCalledWith({
      data: {
        tenantId,
        supplyItemId: dto.supplyItemId,
        fromUnit: dto.fromUnit,
        toUnit: dto.toUnit,
        factor: dto.factor,
        roundingRule: dto.roundingRule,
      },
    });
  });
});
