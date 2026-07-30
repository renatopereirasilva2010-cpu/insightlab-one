import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ClientsService } from '../src/modules/clients/clients.service';

describe('ClientsService', () => {
  let service: ClientsService;
  let prisma: {
    client: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };

  beforeEach(() => {
    prisma = {
      client: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    service = new ClientsService(prisma as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('findAllByTenant should query clients by tenantId', async () => {
    const tenantId = 'tenant-1';
    const expected = [{ id: 'client-1', tenantId }];

    prisma.client.findMany.mockResolvedValue(expected);

    await expect(service.findAllByTenant(tenantId)).resolves.toEqual(expected);
    expect(prisma.client.findMany).toHaveBeenCalledWith({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('create should persist the client payload', async () => {
    const tenantId = 'tenant-1';
    const unitId = 'unit-1';
    const dto = { name: 'Maria', phone: '11999990000', email: undefined, socialName: undefined, source: 'instagram' };
    const created = { id: 'client-1', ...dto, tenantId, unitId };

    prisma.client.create.mockResolvedValue(created);

    await expect(service.create(tenantId, unitId, dto as any)).resolves.toEqual(created);
    expect(prisma.client.create).toHaveBeenCalledWith({
      data: {
        tenantId,
        unitId,
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        socialName: dto.socialName,
        source: dto.source,
      },
    });
  });

  it('update should throw NotFoundException when the client does not belong to the tenant', async () => {
    prisma.client.findFirst.mockResolvedValue(null);

    await expect(service.update('tenant-1', 'client-x', { name: 'Nova' } as any)).rejects.toThrow(
      NotFoundException,
    );
    expect(prisma.client.update).not.toHaveBeenCalled();
  });

  it('update should persist the changed fields for a client scoped to the tenant', async () => {
    const existing = { id: 'client-1', tenantId: 'tenant-1', name: 'Maria' };
    const dto = { name: 'Maria Silva', status: 'INACTIVE' };
    const updated = { ...existing, ...dto };

    prisma.client.findFirst.mockResolvedValue(existing);
    prisma.client.update.mockResolvedValue(updated);

    await expect(service.update('tenant-1', 'client-1', dto as any)).resolves.toEqual(updated);
    expect(prisma.client.findFirst).toHaveBeenCalledWith({
      where: { id: 'client-1', tenantId: 'tenant-1' },
    });
    expect(prisma.client.update).toHaveBeenCalledWith({
      where: { id: 'client-1' },
      data: {
        name: 'Maria Silva',
        phone: undefined,
        email: undefined,
        socialName: undefined,
        source: undefined,
        status: 'INACTIVE',
      },
    });
  });

  describe('updatePhoto', () => {
    it('rejects when no file was sent (missing or wrong mimetype)', async () => {
      await expect(service.updatePhoto('tenant-1', 'client-1', undefined)).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.client.findFirst).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the client does not belong to the tenant', async () => {
      prisma.client.findFirst.mockResolvedValue(null);

      await expect(
        service.updatePhoto('tenant-1', 'client-x', { filename: 'foo.png' } as any),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.client.update).not.toHaveBeenCalled();
    });

    it('saves the built photo URL for a client scoped to the tenant', async () => {
      const existing = { id: 'client-1', tenantId: 'tenant-1' };
      prisma.client.findFirst.mockResolvedValue(existing);
      prisma.client.update.mockResolvedValue({ ...existing, photoUrl: '/uploads/clients/tenant-1/client-1-1.png' });

      await service.updatePhoto('tenant-1', 'client-1', { filename: 'client-1-1.png' } as any);

      expect(prisma.client.update).toHaveBeenCalledWith({
        where: { id: 'client-1' },
        data: { photoUrl: '/uploads/clients/tenant-1/client-1-1.png' },
      });
    });
  });
});
