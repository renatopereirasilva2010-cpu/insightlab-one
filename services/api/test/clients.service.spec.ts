import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { ClientsService } from '../src/modules/clients/clients.service';

describe('ClientsService', () => {
  let service: ClientsService;
  let prisma: {
    client: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      count: jest.Mock;
    };
    appointment: { count: jest.Mock };
    attendance: { count: jest.Mock };
    whatsAppMessage: { count: jest.Mock };
    sale: { findMany: jest.Mock };
    payment: { count: jest.Mock };
    commission: { count: jest.Mock };
    fiscalDocument: { count: jest.Mock };
    user: { findUnique: jest.Mock };
  };

  beforeEach(() => {
    prisma = {
      client: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      appointment: { count: jest.fn().mockResolvedValue(0) },
      attendance: { count: jest.fn().mockResolvedValue(0) },
      whatsAppMessage: { count: jest.fn().mockResolvedValue(0) },
      sale: { findMany: jest.fn().mockResolvedValue([]) },
      payment: { count: jest.fn().mockResolvedValue(0) },
      commission: { count: jest.fn().mockResolvedValue(0) },
      fiscalDocument: { count: jest.fn().mockResolvedValue(0) },
      user: { findUnique: jest.fn().mockResolvedValue({ name: 'Renato', email: 'admin@mix-demo.local' }) },
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

  it('findAllByTenant should paginate and count when page/pageSize are given, without changing the unbounded default used elsewhere', async () => {
    const tenantId = 'tenant-1';
    const expected = [{ id: 'client-1', tenantId }];

    prisma.client.count.mockResolvedValue(7286);
    prisma.client.findMany.mockResolvedValue(expected);

    await expect(service.findAllByTenant(tenantId, { page: 2, pageSize: 50 })).resolves.toEqual({
      items: expected,
      total: 7286,
      page: 2,
      pageSize: 50,
    });
    expect(prisma.client.findMany).toHaveBeenCalledWith({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      skip: 50,
      take: 50,
    });
    expect(prisma.client.count).toHaveBeenCalledWith({ where: { tenantId } });
  });

  describe('create', () => {
    it('persists the client payload when there is no phone conflict', async () => {
      const tenantId = 'tenant-1';
      const unitId = 'unit-1';
      const dto = { name: 'Maria', phone: '11999990000', email: undefined, socialName: undefined, source: 'instagram' };
      const created = { id: 'client-1', ...dto, tenantId, unitId };

      prisma.client.findMany.mockResolvedValue([]);
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

    it('rejects with ConflictException when another client already has the same phone (digits-only match, ignoring formatting)', async () => {
      const tenantId = 'tenant-1';
      const dto = { name: 'Maria Nova', phone: '(41) 99977-2609' };

      prisma.client.findMany.mockResolvedValue([
        { id: 'existing-1', name: 'Maria Antiga', phone: '41999772609', status: 'ACTIVE' },
      ]);

      await expect(service.create(tenantId, null, dto as any)).rejects.toThrow(ConflictException);
      expect(prisma.client.create).not.toHaveBeenCalled();
    });

    it('does not block creation when the phone is too short to be a real conflict signal', async () => {
      prisma.client.findMany.mockResolvedValue([{ id: 'existing-1', name: 'X', phone: '123', status: 'ACTIVE' }]);
      prisma.client.create.mockResolvedValue({ id: 'client-2' });

      await expect(service.create('tenant-1', null, { name: 'Y', phone: '123' } as any)).resolves.toBeDefined();
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

  describe('getDeleteImpact', () => {
    it('throws NotFoundException when the client does not belong to the tenant', async () => {
      prisma.client.findFirst.mockResolvedValue(null);
      await expect(service.getDeleteImpact('tenant-1', 'client-x')).rejects.toThrow(NotFoundException);
    });

    it('reports canHardDelete=true when there is zero linked history', async () => {
      prisma.client.findFirst.mockResolvedValue({ id: 'client-1', name: 'Maria', status: 'ACTIVE' });
      prisma.appointment.count.mockResolvedValue(0);
      prisma.attendance.count.mockResolvedValue(0);
      prisma.whatsAppMessage.count.mockResolvedValue(0);
      prisma.sale.findMany.mockResolvedValue([]);

      const result = await service.getDeleteImpact('tenant-1', 'client-1');
      expect(result.canHardDelete).toBe(true);
      expect(result.counts).toEqual({
        appointments: 0,
        attendances: 0,
        whatsAppMessages: 0,
        sales: 0,
        payments: 0,
        commissions: 0,
        fiscalDocuments: 0,
      });
      // sem vendas, nunca deveria nem consultar payment/commission/fiscalDocument
      expect(prisma.payment.count).not.toHaveBeenCalled();
    });

    it('reports canHardDelete=false and the full breakdown (payments/commissions/fiscalDocuments via sale ids) when the client has sales', async () => {
      prisma.client.findFirst.mockResolvedValue({ id: 'client-1', name: 'Maria', status: 'ACTIVE' });
      prisma.appointment.count.mockResolvedValue(2);
      prisma.attendance.count.mockResolvedValue(1);
      prisma.whatsAppMessage.count.mockResolvedValue(0);
      prisma.sale.findMany.mockResolvedValue([{ id: 'sale-1' }, { id: 'sale-2' }]);
      prisma.payment.count.mockResolvedValue(3);
      prisma.commission.count.mockResolvedValue(2);
      prisma.fiscalDocument.count.mockResolvedValue(1);

      const result = await service.getDeleteImpact('tenant-1', 'client-1');
      expect(result.canHardDelete).toBe(false);
      expect(result.counts).toEqual({
        appointments: 2,
        attendances: 1,
        whatsAppMessages: 0,
        sales: 2,
        payments: 3,
        commissions: 2,
        fiscalDocuments: 1,
      });
      expect(prisma.payment.count).toHaveBeenCalledWith({ where: { saleId: { in: ['sale-1', 'sale-2'] } } });
      expect(prisma.commission.count).toHaveBeenCalledWith({ where: { saleId: { in: ['sale-1', 'sale-2'] } } });
      expect(prisma.fiscalDocument.count).toHaveBeenCalledWith({
        where: { sourceType: 'SALE', sourceId: { in: ['sale-1', 'sale-2'] } },
      });
    });
  });

  describe('remove', () => {
    it('hard-deletes the client when there is no linked history at all', async () => {
      prisma.client.findFirst.mockResolvedValue({ id: 'client-1', name: 'Maria', status: 'ACTIVE' });
      prisma.appointment.count.mockResolvedValue(0);
      prisma.attendance.count.mockResolvedValue(0);
      prisma.whatsAppMessage.count.mockResolvedValue(0);
      prisma.sale.findMany.mockResolvedValue([]);

      const result = await service.remove('tenant-1', 'client-1', 'user-1');

      expect(result.mode).toBe('DELETED');
      expect(prisma.client.delete).toHaveBeenCalledWith({ where: { id: 'client-1' } });
      expect(prisma.client.update).not.toHaveBeenCalled();
    });

    it('never hard-deletes a client that has any linked history - deactivates and stamps an audit note instead, preserving existing notes', async () => {
      prisma.client.findFirst.mockResolvedValue({
        id: 'client-1',
        name: 'Maria',
        status: 'ACTIVE',
        notes: 'Prefere atendimento pela manhã.',
      });
      prisma.appointment.count.mockResolvedValue(0);
      prisma.attendance.count.mockResolvedValue(0);
      prisma.whatsAppMessage.count.mockResolvedValue(0);
      prisma.sale.findMany.mockResolvedValue([{ id: 'sale-1' }]);
      prisma.payment.count.mockResolvedValue(1);
      prisma.commission.count.mockResolvedValue(1);
      prisma.fiscalDocument.count.mockResolvedValue(0);
      prisma.client.update.mockResolvedValue({ id: 'client-1', status: 'INACTIVE' });

      const result = await service.remove('tenant-1', 'client-1', 'user-1');

      expect(result.mode).toBe('DEACTIVATED');
      expect(prisma.client.delete).not.toHaveBeenCalled();
      expect(prisma.client.update).toHaveBeenCalledTimes(1);
      const call = prisma.client.update.mock.calls[0][0];
      expect(call.where).toEqual({ id: 'client-1' });
      expect(call.data.status).toBe('INACTIVE');
      expect(call.data.notes).toContain('Renato');
      expect(call.data.notes).toContain('excluído');
      expect(call.data.notes).toContain('Prefere atendimento pela manhã.');
    });

    it('falls back to the acting user email when they have no display name set', async () => {
      prisma.client.findFirst.mockResolvedValue({ id: 'client-1', name: 'Maria', status: 'ACTIVE', notes: null });
      prisma.appointment.count.mockResolvedValue(1);
      prisma.attendance.count.mockResolvedValue(0);
      prisma.whatsAppMessage.count.mockResolvedValue(0);
      prisma.sale.findMany.mockResolvedValue([]);
      prisma.user.findUnique.mockResolvedValue({ name: null, email: 'admin@mix-demo.local' });
      prisma.client.update.mockResolvedValue({ id: 'client-1', status: 'INACTIVE' });

      await service.remove('tenant-1', 'client-1', 'user-1');

      const call = prisma.client.update.mock.calls[0][0];
      expect(call.data.notes).toContain('admin@mix-demo.local');
    });
  });
});
