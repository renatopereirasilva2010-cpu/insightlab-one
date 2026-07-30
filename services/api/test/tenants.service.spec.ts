import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { TenantsService } from '../src/modules/tenants/tenants.service';

describe('TenantsService', () => {
  let service: TenantsService;
  let prisma: {
    tenant: { findMany: jest.Mock; update: jest.Mock };
  };

  beforeEach(() => {
    prisma = {
      tenant: { findMany: jest.fn(), update: jest.fn() },
    };

    service = new TenantsService(prisma as any);
  });

  describe('updateLogo', () => {
    it('rejects when the caller is not the target tenant', async () => {
      await expect(
        service.updateLogo('tenant-1', 'tenant-2', { filename: 'logo.png' } as any),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.tenant.update).not.toHaveBeenCalled();
    });

    it('rejects when no file was sent', async () => {
      await expect(service.updateLogo('tenant-1', 'tenant-1', undefined)).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.tenant.update).not.toHaveBeenCalled();
    });

    it('saves the built logo URL for the caller own tenant', async () => {
      prisma.tenant.update.mockResolvedValue({ id: 'tenant-1', logoUrl: '/uploads/tenants/tenant-1/tenant-1-1.png' });

      await service.updateLogo('tenant-1', 'tenant-1', { filename: 'tenant-1-1.png' } as any);

      expect(prisma.tenant.update).toHaveBeenCalledWith({
        where: { id: 'tenant-1' },
        data: { logoUrl: '/uploads/tenants/tenant-1/tenant-1-1.png' },
      });
    });
  });
});
