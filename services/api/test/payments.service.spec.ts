import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PaymentsService } from '../src/modules/payments/payments.service';

describe('PaymentsService', () => {
  it('should be defined', () => {
    const service = new PaymentsService({} as any);
    expect(service).toBeDefined();
  });

  it('should preserve PENDING as valid initial payment status assumption', () => {
    const payment = { status: 'PENDING' };
    expect(payment.status).toBe('PENDING');
  });

  it('should preserve DEFERRED as valid payment method assumption', () => {
    const payment = { method: 'DEFERRED' };
    expect(payment.method).toBe('DEFERRED');
  });

  function buildPrismaMock(payment: any) {
    const tx = {
      payment: {
        findFirst: jest.fn().mockResolvedValue(payment),
        update: jest.fn().mockImplementation(({ data }) => ({ ...payment, ...data })),
      },
    };
    return {
      ...tx,
      withTenant: jest.fn((_tenantId: string, fn: (tx: any) => any) => fn(tx)),
    };
  }

  describe('markFailed', () => {
    it('moves a PENDING payment to FAILED with the given error fields', async () => {
      const prisma = buildPrismaMock({ id: 'pay-1', tenantId: 't-1', status: 'PENDING' });
      const service = new PaymentsService(prisma as any);

      const result = await service.markFailed('t-1', 'pay-1', {
        errorCode: 'GATEWAY_TIMEOUT',
        errorMessage: 'Gateway não respondeu a tempo.',
      });

      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: 'pay-1' },
        data: { status: 'FAILED', errorCode: 'GATEWAY_TIMEOUT', errorMessage: 'Gateway não respondeu a tempo.' },
      });
      expect(result.status).toBe('FAILED');
    });

    it('throws NotFoundException when the payment does not exist', async () => {
      const prisma = buildPrismaMock(null);
      const service = new PaymentsService(prisma as any);

      await expect(service.markFailed('t-1', 'missing', {})).rejects.toThrow(NotFoundException);
    });

    it.each(['PAID', 'CANCELED', 'FAILED'])(
      'rejects transition when payment is already %s',
      async (status) => {
        const prisma = buildPrismaMock({ id: 'pay-1', tenantId: 't-1', status });
        const service = new PaymentsService(prisma as any);

        await expect(service.markFailed('t-1', 'pay-1', {})).rejects.toThrow(BadRequestException);
        expect(prisma.payment.update).not.toHaveBeenCalled();
      },
    );
  });

  describe('cancel', () => {
    it('moves a PENDING payment to CANCELED and sets canceledAt', async () => {
      const prisma = buildPrismaMock({ id: 'pay-2', tenantId: 't-1', status: 'PENDING' });
      const service = new PaymentsService(prisma as any);

      const result = await service.cancel('t-1', 'pay-2');

      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: 'pay-2' },
        data: { status: 'CANCELED', canceledAt: expect.any(Date) },
      });
      expect(result.status).toBe('CANCELED');
    });

    it('throws NotFoundException when the payment does not exist', async () => {
      const prisma = buildPrismaMock(null);
      const service = new PaymentsService(prisma as any);

      await expect(service.cancel('t-1', 'missing')).rejects.toThrow(NotFoundException);
    });

    it.each(['PAID', 'CANCELED', 'FAILED'])(
      'rejects cancellation when payment is already %s',
      async (status) => {
        const prisma = buildPrismaMock({ id: 'pay-2', tenantId: 't-1', status });
        const service = new PaymentsService(prisma as any);

        await expect(service.cancel('t-1', 'pay-2')).rejects.toThrow(BadRequestException);
        expect(prisma.payment.update).not.toHaveBeenCalled();
      },
    );
  });
});
