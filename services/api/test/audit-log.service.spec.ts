import { AuditLogService } from '../src/common/audit/audit-log.service';

describe('AuditLogService', () => {
  function buildPrismaMock() {
    return {
      auditLog: {
        create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
    };
  }

  it('records an audit entry with the given fields', async () => {
    const prisma = buildPrismaMock();
    const service = new AuditLogService(prisma as any);

    await service.record({
      tenantId: 't-1',
      unitId: 'u-1',
      userId: 'user-1',
      entity: 'payments',
      entityId: 'pay-1',
      action: 'POST /v1/payments/:id/mark-failed',
      traceId: 'trace-1',
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        tenantId: 't-1',
        unitId: 'u-1',
        userId: 'user-1',
        entity: 'payments',
        entityId: 'pay-1',
        action: 'POST /v1/payments/:id/mark-failed',
        traceId: 'trace-1',
        metadataJson: undefined,
      },
    });
  });

  it('defaults optional fields to null when omitted', async () => {
    const prisma = buildPrismaMock();
    const service = new AuditLogService(prisma as any);

    await service.record({
      tenantId: 't-1',
      entity: 'payments',
      entityId: 'pay-1',
      action: 'POST /v1/payments',
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        unitId: null,
        userId: null,
        traceId: null,
      }),
    });
  });

  it('does not throw when the write fails - audit must never break the original request', async () => {
    const prisma = buildPrismaMock();
    prisma.auditLog.create.mockRejectedValue(new Error('db unavailable'));
    const service = new AuditLogService(prisma as any);

    await expect(
      service.record({
        tenantId: 't-1',
        entity: 'payments',
        entityId: 'pay-1',
        action: 'POST /v1/payments',
      }),
    ).resolves.toBeUndefined();
  });

  describe('query', () => {
    it('scopes findMany/count by tenantId and paginates with the given defaults', async () => {
      const prisma = buildPrismaMock();
      const service = new AuditLogService(prisma as any);

      await service.query('t-1', {});

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: 't-1' },
          skip: 0,
          take: 50,
        }),
      );
      expect(prisma.auditLog.count).toHaveBeenCalledWith({ where: { tenantId: 't-1' } });
    });

    it('applies entity and date-range filters when provided', async () => {
      const prisma = buildPrismaMock();
      const service = new AuditLogService(prisma as any);

      await service.query('t-1', {
        entity: 'payments',
        from: '2026-07-01T00:00:00.000Z',
        to: '2026-07-31T00:00:00.000Z',
        page: 2,
        pageSize: 10,
      });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            tenantId: 't-1',
            entity: 'payments',
            createdAt: {
              gte: new Date('2026-07-01T00:00:00.000Z'),
              lte: new Date('2026-07-31T00:00:00.000Z'),
            },
          },
          skip: 10,
          take: 10,
        }),
      );
    });
  });
});
