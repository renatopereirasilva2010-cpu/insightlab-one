import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ServicesCatalogService } from '../src/modules/services-catalog/services-catalog.service';

describe('ServicesCatalogService', () => {
  let service: ServicesCatalogService;
  let prisma: {
    serviceCatalog: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };

  beforeEach(() => {
    prisma = {
      serviceCatalog: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    service = new ServicesCatalogService(prisma as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('findAllByTenant should query services by tenantId', async () => {
    const tenantId = 'tenant-1';
    const expected = [{ id: 'service-1', tenantId }];

    prisma.serviceCatalog.findMany.mockResolvedValue(expected);

    await expect(service.findAllByTenant(tenantId)).resolves.toEqual(expected);
    expect(prisma.serviceCatalog.findMany).toHaveBeenCalledWith({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('create should persist the service payload', async () => {
    const tenantId = 'tenant-1';
    const unitId = 'unit-1';
    const dto = { name: 'Corte', durationMinutes: 30, price: 60 };
    const created = { id: 'service-1', ...dto, tenantId, unitId };

    prisma.serviceCatalog.create.mockResolvedValue(created);

    await expect(service.create(tenantId, unitId, dto as any)).resolves.toEqual(created);
    expect(prisma.serviceCatalog.create).toHaveBeenCalledWith({
      data: {
        tenantId,
        unitId,
        name: dto.name,
        description: undefined,
        durationMinutes: dto.durationMinutes,
        price: dto.price,
        cnaeCode: undefined,
        serviceListItemCode: undefined,
        issRate: undefined,
        availableOnline: true,
      },
    });
  });

  it('update should throw NotFoundException when the service does not belong to the tenant', async () => {
    prisma.serviceCatalog.findFirst.mockResolvedValue(null);

    await expect(
      service.update('tenant-1', 'service-x', { name: 'Novo nome' } as any),
    ).rejects.toThrow(NotFoundException);
    expect(prisma.serviceCatalog.update).not.toHaveBeenCalled();
  });

  it('update should persist the changed fields for a service scoped to the tenant', async () => {
    const existing = { id: 'service-1', tenantId: 'tenant-1', name: 'Corte' };
    const dto = { name: 'Corte Premium', price: 80, status: 'INACTIVE' };
    const updated = { ...existing, ...dto };

    prisma.serviceCatalog.findFirst.mockResolvedValue(existing);
    prisma.serviceCatalog.update.mockResolvedValue(updated);

    await expect(service.update('tenant-1', 'service-1', dto as any)).resolves.toEqual(updated);
    expect(prisma.serviceCatalog.findFirst).toHaveBeenCalledWith({
      where: { id: 'service-1', tenantId: 'tenant-1' },
    });
    expect(prisma.serviceCatalog.update).toHaveBeenCalledWith({
      where: { id: 'service-1' },
      data: {
        name: 'Corte Premium',
        description: undefined,
        durationMinutes: undefined,
        price: 80,
        availableOnline: undefined,
        requiresProfessional: undefined,
        status: 'INACTIVE',
        issRate: undefined,
      },
    });
  });

  it('updateFiscal should throw BadRequestException when payload is empty', async () => {
    await expect(service.updateFiscal('tenant-1', 'service-1', {} as any)).rejects.toThrow(
      BadRequestException,
    );
    expect(prisma.serviceCatalog.findFirst).not.toHaveBeenCalled();
  });

  it('updateFiscal should throw NotFoundException when the service does not belong to the tenant', async () => {
    prisma.serviceCatalog.findFirst.mockResolvedValue(null);

    await expect(
      service.updateFiscal('tenant-1', 'service-x', { cnaeCode: '1234567' } as any),
    ).rejects.toThrow(NotFoundException);
    expect(prisma.serviceCatalog.update).not.toHaveBeenCalled();
  });

  it('updateFiscal should persist fiscal fields for a service scoped to the tenant', async () => {
    const existing = { id: 'service-1', tenantId: 'tenant-1' };
    const dto = { cnaeCode: '1234567', serviceListItemCode: '1.01', issRate: 5 };
    const updated = { ...existing, ...dto };

    prisma.serviceCatalog.findFirst.mockResolvedValue(existing);
    prisma.serviceCatalog.update.mockResolvedValue(updated);

    await expect(service.updateFiscal('tenant-1', 'service-1', dto as any)).resolves.toEqual(
      updated,
    );
    expect(prisma.serviceCatalog.update).toHaveBeenCalledWith({
      where: { id: 'service-1' },
      data: {
        cnaeCode: '1234567',
        serviceListItemCode: '1.01',
        issRate: 5,
      },
    });
  });
});
