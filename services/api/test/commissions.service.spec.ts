import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CommissionsService } from '../src/modules/commissions/commissions.service';

describe('CommissionsService', () => {
  it('should be defined', () => {
    const service = new CommissionsService({} as any);
    expect(service).toBeDefined();
  });

  it('should preserve PENDING as valid initial commission status assumption', () => {
    const commission = { status: 'PENDING' };
    expect(commission.status).toBe('PENDING');
  });

  it('should preserve ON_PAYMENT as valid release mode assumption', () => {
    const commission = { releaseMode: 'ON_PAYMENT' };
    expect(commission.releaseMode).toBe('ON_PAYMENT');
  });

  function buildPrismaMock(commission: any) {
    return {
      commission: {
        findFirst: jest.fn().mockResolvedValue(commission),
        update: jest.fn().mockImplementation(({ data }) => ({ ...commission, ...data })),
      },
    };
  }

  describe('cancel', () => {
    it('moves a PENDING commission to CANCELED', async () => {
      const prisma = buildPrismaMock({ id: 'com-1', tenantId: 't-1', status: 'PENDING', notes: null });
      const service = new CommissionsService(prisma as any);

      const result = await service.cancel('t-1', 'com-1', {});

      expect(prisma.commission.update).toHaveBeenCalledWith({
        where: { id: 'com-1' },
        data: { status: 'CANCELED', notes: null },
      });
      expect(result.status).toBe('CANCELED');
    });

    it('moves a BLOCKED commission to CANCELED', async () => {
      const prisma = buildPrismaMock({ id: 'com-1', tenantId: 't-1', status: 'BLOCKED', notes: null });
      const service = new CommissionsService(prisma as any);

      const result = await service.cancel('t-1', 'com-1', {});
      expect(result.status).toBe('CANCELED');
    });

    it('throws NotFoundException when the commission does not exist', async () => {
      const prisma = buildPrismaMock(null);
      const service = new CommissionsService(prisma as any);

      await expect(service.cancel('t-1', 'missing', {})).rejects.toThrow(NotFoundException);
    });

    it('rejects canceling an already-canceled commission', async () => {
      const prisma = buildPrismaMock({ id: 'com-1', tenantId: 't-1', status: 'CANCELED' });
      const service = new CommissionsService(prisma as any);

      await expect(service.cancel('t-1', 'com-1', {})).rejects.toThrow(BadRequestException);
      expect(prisma.commission.update).not.toHaveBeenCalled();
    });

    it('rejects canceling a RELEASED commission - that requires financial reversal, not simple cancel', async () => {
      const prisma = buildPrismaMock({ id: 'com-1', tenantId: 't-1', status: 'RELEASED' });
      const service = new CommissionsService(prisma as any);

      await expect(service.cancel('t-1', 'com-1', {})).rejects.toThrow(BadRequestException);
      expect(prisma.commission.update).not.toHaveBeenCalled();
    });
  });
});
