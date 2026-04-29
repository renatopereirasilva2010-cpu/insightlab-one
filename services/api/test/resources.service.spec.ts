import { ResourcesService } from '../src/modules/resources/resources.service';

describe('ResourcesService', () => {
  let service: ResourcesService;
  let prisma: {
    operationalResource: {
      findMany: jest.Mock;
      create: jest.Mock;
    };
  };

  beforeEach(() => {
    prisma = {
      operationalResource: {
        findMany: jest.fn(),
        create: jest.fn(),
      },
    };

    service = new ResourcesService(prisma as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('findAllByTenant should query resources by tenantId', async () => {
    const tenantId = 'tenant-1';
    const expected = [{ id: 'resource-1', tenantId }];

    prisma.operationalResource.findMany.mockResolvedValue(expected);

    await expect(service.findAllByTenant(tenantId)).resolves.toEqual(expected);
    expect(prisma.operationalResource.findMany).toHaveBeenCalledWith({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('create should persist the minimum resource payload', async () => {
    const tenantId = 'tenant-1';
    const unitId = 'unit-1';
    const dto = {
      name: 'Sala 1',
      type: 'ROOM',
      description: 'Sala principal',
    };
    const created = { id: 'resource-1', ...dto, tenantId, unitId };

    prisma.operationalResource.create.mockResolvedValue(created);

    await expect(service.create(tenantId, unitId, dto as any)).resolves.toEqual(created);
    expect(prisma.operationalResource.create).toHaveBeenCalledWith({
      data: {
        tenantId,
        unitId,
        name: dto.name,
        type: dto.type,
        description: dto.description,
      },
    });
  });
});
