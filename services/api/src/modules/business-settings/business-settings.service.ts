import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

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
}
