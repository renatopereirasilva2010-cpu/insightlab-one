import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UpdateBusinessSettingsDto } from './dto/update-business-settings.dto';

@Injectable()
export class BusinessSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings(tenantId: string) {
    const settings = await this.prisma.businessSettings.findUnique({
      where: { tenantId },
    });

    if (!settings) {
      throw new NotFoundException({
        code: 'SETTINGS_NOT_FOUND',
        title: 'Configurações não encontradas',
        message: 'Não encontramos as configurações deste negócio.',
        recommendedAction: 'Revise a configuração inicial do tenant.',
      });
    }

    return settings;
  }

  async update(tenantId: string, dto: UpdateBusinessSettingsDto) {
    const settings = await this.prisma.businessSettings.findUnique({
      where: { tenantId },
    });

    if (!settings) {
      throw new NotFoundException({
        code: 'SETTINGS_NOT_FOUND',
        title: 'Configurações não encontradas',
        message: 'Não encontramos as configurações deste negócio.',
        recommendedAction: 'Revise a configuração inicial do tenant.',
      });
    }

    return this.prisma.businessSettings.update({
      where: { tenantId },
      data: {
        timezone: dto.timezone,
        currency: dto.currency,
        cancelPolicyHours: dto.cancelPolicyHours,
        lateToleranceMinutes: dto.lateToleranceMinutes,
        deferredPaymentLabel: dto.deferredPaymentLabel,
        allowDeferredPayment: dto.allowDeferredPayment,
        commissionReleaseMode: dto.commissionReleaseMode,
        allowCommissionManualRelease: dto.allowCommissionManualRelease,
      },
    });
  }
}
