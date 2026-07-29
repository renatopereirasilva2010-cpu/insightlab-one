import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { BlockCommissionDto } from './dto/block-commission.dto';
import { CancelCommissionDto } from './dto/cancel-commission.dto';
import { GenerateCommissionDto } from './dto/generate-commission.dto';
import { ReleaseCommissionDto } from './dto/release-commission.dto';
import { MarkPayoutPaidDto } from './dto/mark-payout-paid.dto';
import { MarkPayoutFailedDto } from './dto/mark-payout-failed.dto';

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

  async findOwnByUser(tenantId: string, professionalId: string | null) {
    if (!professionalId) {
      throw new BadRequestException({
        code: 'USER_WITHOUT_LINKED_PROFESSIONAL',
        title: 'Conta sem profissional vinculado',
        message: 'Sua conta de acesso não está vinculada a um cadastro de profissional.',
        recommendedAction: 'Peça para um administrador vincular sua conta a um profissional em Usuários.',
      });
    }

    return this.prisma.commission.findMany({
      where: { tenantId, professionalId },
      include: { sale: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async generate(tenantId: string, unitId: string | null, dto: GenerateCommissionDto) {
    const item = await this.prisma.saleItem.findFirst({
      where: { id: dto.saleItemId, tenantId },
      include: { sale: { include: { payments: true } } },
    });

    if (!item) {
      throw new NotFoundException({
        code: 'SALE_ITEM_NOT_FOUND',
        title: 'Item de venda não encontrado',
        message: 'Não encontramos o item de venda informado.',
        recommendedAction: 'Atualize a tela e tente novamente.',
      });
    }

    if (!item.professionalId) {
      throw new BadRequestException({
        code: 'SALE_ITEM_WITHOUT_PROFESSIONAL',
        title: 'Item sem profissional responsável',
        message:
          'Este item de venda não tem um profissional responsável definido, então não é possível gerar comissão avulsa para ele.',
        recommendedAction: 'Defina o profissional responsável no item da venda antes de gerar a comissão.',
      });
    }

    if (dto.baseAmount > Number(item.totalPrice)) {
      throw new BadRequestException({
        code: 'COMMISSION_BASE_EXCEEDS_ITEM',
        title: 'Base de cálculo excede o valor do item',
        message: 'A base de cálculo da comissão não pode ser maior que o valor total do item da venda.',
        recommendedAction: 'Revise o valor informado e tente novamente.',
      });
    }

    const professional = await this.prisma.professional.findFirst({
      where: { id: item.professionalId, tenantId },
    });

    if (!professional) {
      throw new NotFoundException({
        code: 'PROFESSIONAL_NOT_FOUND',
        title: 'Profissional não encontrado',
        message: 'Não encontramos o profissional informado para este tenant.',
        recommendedAction: 'Revise o profissional selecionado e tente novamente.',
      });
    }

    if (professional.commissionRate === null) {
      throw new BadRequestException({
        code: 'PROFESSIONAL_COMMISSION_RATE_NOT_SET',
        title: 'Percentual de comissão não configurado',
        message: 'Este profissional ainda não tem um percentual de comissão configurado no cadastro.',
        recommendedAction: 'Configure o percentual de comissão do profissional antes de gerar comissões.',
      });
    }

    const settings = await this.prisma.businessSettings.findUnique({
      where: { tenantId },
    });

    const existing = await this.prisma.commission.findFirst({
      where: { tenantId, saleItemId: dto.saleItemId },
    });

    if (existing) {
      throw new BadRequestException({
        code: 'COMMISSION_ALREADY_EXISTS',
        title: 'Comissão já existente',
        message: 'Já existe comissão para este item de venda.',
        recommendedAction: 'Atualize a tela antes de tentar novamente.',
      });
    }

    const commissionAmount =
      Math.round(dto.baseAmount * Number(professional.commissionRate)) / 100;

    const allowDeferred = settings?.commissionReleaseAllowDeferred ?? false;
    const hasEligiblePayment = item.sale.payments.some(
      (p) => p.status === 'PAID' || (allowDeferred && p.isDeferred && p.status === 'PENDING'),
    );
    const releaseMode = settings?.commissionReleaseMode ?? 'ON_PAYMENT';

    let status: 'PENDING' | 'RELEASED' | 'BLOCKED' = 'PENDING';
    let releasedAt: Date | null = null;

    if (releaseMode === 'IMMEDIATE') {
      status = 'RELEASED';
      releasedAt = new Date();
    } else if (releaseMode === 'ON_PAYMENT' && hasEligiblePayment) {
      status = 'RELEASED';
      releasedAt = new Date();
    }

    return this.prisma.commission.create({
      data: {
        tenantId,
        unitId,
        saleId: item.saleId,
        saleItemId: item.id,
        professionalId: item.professionalId,
        baseAmount: dto.baseAmount,
        commissionAmount,
        releaseMode: releaseMode as any,
        status: status as any,
        releasedAt,
        notes: dto.notes,
        ...(status === 'RELEASED'
          ? {
              payout: {
                create: {
                  tenantId,
                  unitId,
                  professionalId: item.professionalId,
                  amount: commissionAmount,
                },
              },
            }
          : {}),
      },
    });
  }

  async release(tenantId: string, commissionId: string, dto: ReleaseCommissionDto) {
    const commission = await this.prisma.commission.findFirst({
      where: { id: commissionId, tenantId },
      include: { payout: true },
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
        ...(commission.payout
          ? {}
          : {
              payout: {
                create: {
                  tenantId,
                  unitId: commission.unitId,
                  professionalId: commission.professionalId,
                  amount: commission.commissionAmount,
                },
              },
            }),
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

  async cancel(tenantId: string, commissionId: string, dto: CancelCommissionDto) {
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

    if (commission.status === 'CANCELED') {
      throw new BadRequestException({
        code: 'COMMISSION_ALREADY_CANCELED',
        title: 'Comissão já cancelada',
        message: 'Esta comissão já foi cancelada anteriormente.',
        recommendedAction: 'Atualize a tela antes de tentar novamente.',
      });
    }

    if (commission.status === 'RELEASED') {
      throw new BadRequestException({
        code: 'COMMISSION_ALREADY_RELEASED',
        title: 'Comissão já liberada',
        message: 'Não é possível cancelar uma comissão já liberada. Isso exige estorno financeiro, fora do escopo deste cancelamento.',
        recommendedAction: 'Trate como estorno financeiro, não como cancelamento simples.',
      });
    }

    return this.prisma.commission.update({
      where: { id: commission.id },
      data: {
        status: 'CANCELED',
        notes: dto.notes ? `${commission.notes ?? ''}\n[CANCELAMENTO] ${dto.notes}`.trim() : commission.notes,
      },
    });
  }

  findPayouts(tenantId: string) {
    return this.prisma.commissionPayout.findMany({
      where: { tenantId },
      include: { professional: true, commission: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOwnPayouts(tenantId: string, professionalId: string | null) {
    if (!professionalId) {
      throw new BadRequestException({
        code: 'USER_WITHOUT_LINKED_PROFESSIONAL',
        title: 'Conta sem profissional vinculado',
        message: 'Sua conta de acesso não está vinculada a um cadastro de profissional.',
        recommendedAction: 'Peça para um administrador vincular sua conta a um profissional em Usuários.',
      });
    }

    return this.prisma.commissionPayout.findMany({
      where: { tenantId, professionalId },
      include: { commission: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markPayoutPaid(tenantId: string, payoutId: string, dto: MarkPayoutPaidDto) {
    const payout = await this.findOwnedPayout(tenantId, payoutId);

    if (payout.status === 'PAID') {
      throw new BadRequestException({
        code: 'PAYOUT_ALREADY_PAID',
        title: 'Repasse já pago',
        message: 'Este repasse já foi marcado como pago anteriormente.',
        recommendedAction: 'Atualize a tela antes de tentar novamente.',
      });
    }

    if (payout.status === 'CANCELED') {
      throw new BadRequestException({
        code: 'PAYOUT_CANCELED',
        title: 'Repasse cancelado',
        message: 'Não é possível marcar como pago um repasse cancelado.',
        recommendedAction: 'Revise o histórico antes de tentar novamente.',
      });
    }

    return this.prisma.commissionPayout.update({
      where: { id: payout.id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        method: dto.method ?? payout.method,
        providerReference: dto.providerReference,
        errorCode: null,
        errorMessage: null,
        notes: dto.notes ? `${payout.notes ?? ''}\n[PAGO] ${dto.notes}`.trim() : payout.notes,
      },
    });
  }

  async markPayoutFailed(tenantId: string, payoutId: string, dto: MarkPayoutFailedDto) {
    const payout = await this.findOwnedPayout(tenantId, payoutId);

    if (payout.status === 'PAID') {
      throw new BadRequestException({
        code: 'PAYOUT_ALREADY_PAID',
        title: 'Repasse já pago',
        message: 'Não é possível marcar como falho um repasse já pago.',
        recommendedAction: 'Revise o histórico antes de tentar novamente.',
      });
    }

    return this.prisma.commissionPayout.update({
      where: { id: payout.id },
      data: {
        status: 'FAILED',
        errorCode: dto.errorCode,
        errorMessage: dto.errorMessage,
      },
    });
  }

  private async findOwnedPayout(tenantId: string, payoutId: string) {
    const payout = await this.prisma.commissionPayout.findFirst({
      where: { id: payoutId, tenantId },
    });

    if (!payout) {
      throw new NotFoundException({
        code: 'PAYOUT_NOT_FOUND',
        title: 'Repasse não encontrado',
        message: 'Não encontramos o repasse informado.',
        recommendedAction: 'Atualize a tela e tente novamente.',
      });
    }

    return payout;
  }
}
