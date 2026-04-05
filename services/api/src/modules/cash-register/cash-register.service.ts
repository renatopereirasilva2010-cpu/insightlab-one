import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CloseCashRegisterDto } from './dto/close-cash-register.dto';
import { OpenCashRegisterDto } from './dto/open-cash-register.dto';

@Injectable()
export class CashRegisterService {
  constructor(private readonly prisma: PrismaService) {}

  findAllByTenant(tenantId: string) {
    return this.prisma.cashRegister.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async open(tenantId: string, unitId: string | null, dto: OpenCashRegisterDto) {
    const opened = await this.prisma.cashRegister.findFirst({
      where: { tenantId, unitId, status: 'OPEN' },
    });

    if (opened) {
      throw new BadRequestException({
        code: 'CASH_REGISTER_ALREADY_OPEN',
        title: 'Caixa já aberto',
        message: 'Já existe um caixa aberto para este contexto.',
        recommendedAction: 'Feche o caixa atual antes de abrir um novo.',
      });
    }

    return this.prisma.cashRegister.create({
      data: {
        tenantId,
        unitId,
        name: dto.name,
        status: 'OPEN',
        openedAt: new Date(),
        openingBalance: dto.openingBalance ?? 0,
        notes: dto.notes,
      },
    });
  }

  async close(tenantId: string, cashRegisterId: string, dto: CloseCashRegisterDto) {
    const cashRegister = await this.prisma.cashRegister.findFirst({
      where: { id: cashRegisterId, tenantId },
    });

    if (!cashRegister) {
      throw new NotFoundException({
        code: 'CASH_REGISTER_NOT_FOUND',
        title: 'Caixa não encontrado',
        message: 'Não encontramos o caixa informado.',
        recommendedAction: 'Atualize a tela e tente novamente.',
      });
    }

    if (cashRegister.status !== 'OPEN') {
      throw new BadRequestException({
        code: 'CASH_REGISTER_NOT_OPEN',
        title: 'Caixa não aberto',
        message: 'Somente caixas abertos podem ser fechados.',
        recommendedAction: 'Revise o status do caixa antes de tentar novamente.',
      });
    }

    return this.prisma.cashRegister.update({
      where: { id: cashRegister.id },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
        closingBalance: dto.closingBalance,
        notes: dto.notes ? `${cashRegister.notes ?? ''}\n[FECHAMENTO] ${dto.notes}`.trim() : cashRegister.notes,
      },
    });
  }
}
