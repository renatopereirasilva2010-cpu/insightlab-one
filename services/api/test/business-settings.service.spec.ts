import { NotFoundException } from '@nestjs/common';
import { BusinessSettingsService } from '../src/modules/business-settings/business-settings.service';

describe('BusinessSettingsService', () => {
  let service: BusinessSettingsService;
  let prisma: {
    businessSettings: { findUnique: jest.Mock; update: jest.Mock };
  };

  beforeEach(() => {
    prisma = {
      businessSettings: { findUnique: jest.fn(), update: jest.fn() },
    };

    service = new BusinessSettingsService(prisma as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('getSettings should throw NotFoundException when the tenant has no settings row', async () => {
    prisma.businessSettings.findUnique.mockResolvedValue(null);

    await expect(service.getSettings('tenant-1')).rejects.toThrow(NotFoundException);
  });

  it('getSettings should return the settings for the tenant', async () => {
    const settings = { tenantId: 'tenant-1', currency: 'BRL' };
    prisma.businessSettings.findUnique.mockResolvedValue(settings);

    await expect(service.getSettings('tenant-1')).resolves.toEqual(settings);
  });

  it('update should throw NotFoundException when the tenant has no settings row', async () => {
    prisma.businessSettings.findUnique.mockResolvedValue(null);

    await expect(
      service.update('tenant-1', { currency: 'USD' } as any),
    ).rejects.toThrow(NotFoundException);
    expect(prisma.businessSettings.update).not.toHaveBeenCalled();
  });

  it('update should persist the changed fields for the tenant', async () => {
    const existing = { tenantId: 'tenant-1', currency: 'BRL', cancelPolicyHours: 24 };
    const dto = { currency: 'USD', cancelPolicyHours: 48 };
    const updated = { ...existing, ...dto };

    prisma.businessSettings.findUnique.mockResolvedValue(existing);
    prisma.businessSettings.update.mockResolvedValue(updated);

    await expect(service.update('tenant-1', dto as any)).resolves.toEqual(updated);
    expect(prisma.businessSettings.findUnique).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1' },
    });
    expect(prisma.businessSettings.update).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1' },
      data: {
        timezone: undefined,
        currency: 'USD',
        cancelPolicyHours: 48,
        lateToleranceMinutes: undefined,
        deferredPaymentLabel: undefined,
        allowDeferredPayment: undefined,
        commissionReleaseMode: undefined,
        allowCommissionManualRelease: undefined,
      },
    });
  });
});
