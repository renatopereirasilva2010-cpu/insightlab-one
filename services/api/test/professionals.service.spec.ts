import { NotFoundException } from '@nestjs/common';
import { ProfessionalsService } from '../src/modules/professionals/professionals.service';

describe('ProfessionalsService', () => {
  let service: ProfessionalsService;
  let prisma: {
    professional: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };

  beforeEach(() => {
    prisma = {
      professional: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    service = new ProfessionalsService(prisma as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('findAllByTenant should query professionals by tenantId', async () => {
    const tenantId = 'tenant-1';
    const expected = [{ id: 'prof-1', tenantId }];

    prisma.professional.findMany.mockResolvedValue(expected);

    await expect(service.findAllByTenant(tenantId)).resolves.toEqual(expected);
    expect(prisma.professional.findMany).toHaveBeenCalledWith({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('create should persist the professional payload', async () => {
    const tenantId = 'tenant-1';
    const unitId = 'unit-1';
    const dto = { name: 'Joana', phone: undefined, email: undefined, roleTitle: 'Cabeleireira' };
    const created = { id: 'prof-1', ...dto, tenantId, unitId };

    prisma.professional.create.mockResolvedValue(created);

    await expect(service.create(tenantId, unitId, dto as any)).resolves.toEqual(created);
    expect(prisma.professional.create).toHaveBeenCalledWith({
      data: {
        tenantId,
        unitId,
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        roleTitle: dto.roleTitle,
      },
    });
  });

  it('update should throw NotFoundException when the professional does not belong to the tenant', async () => {
    prisma.professional.findFirst.mockResolvedValue(null);

    await expect(
      service.update('tenant-1', 'prof-x', { name: 'Nova' } as any),
    ).rejects.toThrow(NotFoundException);
    expect(prisma.professional.update).not.toHaveBeenCalled();
  });

  it('update should persist the changed fields for a professional scoped to the tenant', async () => {
    const existing = { id: 'prof-1', tenantId: 'tenant-1', name: 'Joana' };
    const dto = { status: 'INACTIVE', onlineBookingEnabled: false };
    const updated = { ...existing, ...dto };

    prisma.professional.findFirst.mockResolvedValue(existing);
    prisma.professional.update.mockResolvedValue(updated);

    await expect(service.update('tenant-1', 'prof-1', dto as any)).resolves.toEqual(updated);
    expect(prisma.professional.findFirst).toHaveBeenCalledWith({
      where: { id: 'prof-1', tenantId: 'tenant-1' },
    });
    expect(prisma.professional.update).toHaveBeenCalledWith({
      where: { id: 'prof-1' },
      data: {
        name: undefined,
        phone: undefined,
        email: undefined,
        roleTitle: undefined,
        status: 'INACTIVE',
        onlineBookingEnabled: false,
      },
    });
  });
});
