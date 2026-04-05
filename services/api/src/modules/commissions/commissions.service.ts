import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { BlockCommissionDto } from './dto/block-commission.dto';
import { GenerateCommissionDto } from './dto/generate-commission.dto';
import { ReleaseCommissionDto } from './dto/release-commission.dto';

@Injectable()
export class CommissionsService {
  constructor(private readonly prisma: PrismaService) {}

  findAllByTenant(tenantId: string) {
    return this.prisma.commission.findMany({
      where: { tenantId },
      include: { sale: true, professional: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async generate(tenantId: string, unitId: string | null, dto: GenerateCommissionDto) {
    const sale = await this.prisma.sale.findFirst({
      where: { id: dto.saleId, tenantId },
      include: { payments: true },
    });

    if (!sale) {
      throw new NotFoundException({
        code: 'SALE_NOT_FOUND',
        title: 'Venda não encontrada',
        message: 'Não encontramos a venda informada.',
        recommendedAction: 'Atualize a tela e tente novamente.',
      });
    }

    const settings = await this.prisma.businessSettings.findUnique({
      where: { tenantId },
    });

    const existing = await this.prisma.commission.findFirst({
      where: { tenantId, saleId: dto.saleId, professionalId: dto.professionalId },
    });

    if (existing) {
      throw new BadRequestException({
        code: 'COMMISSION_ALREADY_EXISTS',
        title: 'Comissão já existente',
        message: 'Já existe comissão para esta venda e profissional.',
        recommendedAction: 'Atualize a tela antes de tentar novamente.',
      });
    }

    const hasPaidPayment = sale.payments.some((p) => p.status === 'PAID');
    const releaseMode = settings?.commissionReleaseMode ?? 'ON_PAYMENT';

    let status: 'PENDING' | 'RELEASED' | 'BLOCKED' = 'PENDING';
    let releasedAt: Date | null = null;

    if (releaseMode === 'IMMEDIATE') {
      status = 'RELEASED';
      releasedAt = new Date();
    } else if (releaseMode === 'ON_PAYMENT' && hasPaidPayment) {
      status = 'RELEASED';
      releasedAt = new Date();
    }

    return this.prisma.commission.create({
      data: {
        tenantId,
        unitId,
        saleId: dto.saleId,
        professionalId: dto.professionalId,
        baseAmount: dto.baseAmount,
        commissionAmount: dto.commissionAmount,
        releaseMode: releaseMode as any,
        status: status as any,
        releasedAt,
        notes: dto.notes,
      },
    });
  }

  async release(tenantId: string, commissionId: string, dto: ReleaseCommissionDto) {
    const commission = await this.prisma.commission.findFirst({
      where: { id: commissionId, tenantId },
    });

    if (!commission) {
      throw new NotFoundException({
        code: 'COMMISSION_NOT_FOUND',
        title: 'Comissão não encontrada',
        message: 'Não encontramos a comissão informada.',
        recommendedAction: 'Atualize a tela e tente novamente.',
      });
    }

    if (commission.status === 'RELEASED') {
      throw new BadRequestException({
        code: 'COMMISSION_ALREADY_RELEASED',
        title: 'Comissão já liberada',
        message: 'Esta comissão já foi liberada anteriormente.',
        recommendedAction: 'Atualize a tela antes de tentar novamente.',
      });
    }

    if (commission.status === 'CANCELED') {
      throw new BadRequestException({
        code: 'COMMISSION_ALREADY_CANCELED',
        title: 'Comissão cancelada',
        message: 'Não é possível liberar uma comissão cancelada.',
        recommendedAction: 'Revise o histórico antes de tentar novamente.',
      });
    }

    return this.prisma.commission.update({
      where: { id: commission.id },
      data: {
        status: 'RELEASED',
        releasedManually: true,
        releasedAt: new Date(),
        notes: dto.notes ? `${commission.notes ?? ''}\n[LIBERAÇÃO] ${dto.notes}`.trim() : commission.notes,
      },
    });
  }

  async block(tenantId: string, commissionId: string, dto: BlockCommissionDto) {
    const commission = await this.prisma.commission.findFirst({
      where: { id: commissionId, tenantId },
    });

    if (!commission) {
      throw new NotFoundException({
        code: 'COMMISSION_NOT_FOUND',
        title: 'Comissão não encontrada',
        message: 'Não encontramos a comissão informada.',
        recommendedAction: 'Atualize a tela e tente novamente.',
      });
    }

    if (commission.status === 'BLOCKED') {
      throw new BadRequestException({
        code: 'COMMISSION_ALREADY_BLOCKED',
        title: 'Comissão já bloqueada',
        message: 'Esta comissão já está bloqueada.',
        recommendedAction: 'Atualize a tela antes de tentar novamente.',
      });
    }

    if (commission.status === 'RELEASED') {
      throw new BadRequestException({
        code: 'COMMISSION_ALREADY_RELEASED',
        title: 'Comissão já liberada',
        message: 'Não é possível bloquear uma comissão já liberada.',
        recommendedAction: 'Revise o histórico antes de tentar novamente.',
      });
    }

    return this.prisma.commission.update({
      where: { id: commission.id },
      data: {
        status: 'BLOCKED',
        notes: dto.notes ? `${commission.notes ?? ''}\n[BLOQUEIO] ${dto.notes}`.trim() : commission.notes,
      },
    });
  }
}
