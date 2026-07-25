import { AuditLogService } from '../src/common/audit/audit-log.service';

describe('AuditLogService', () => {
  function buildPrismaMock() {
    return {
      auditLog: {
        create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
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
});
