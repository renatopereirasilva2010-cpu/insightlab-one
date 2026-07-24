import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { MarkFailedPaymentDto } from './dto/mark-failed-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  findAllByTenant(tenantId: string) {
    return this.prisma.payment.findMany({
      where: { tenantId },
      include: { sale: true, cashRegister: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(tenantId: string, unitId: string | null, dto: CreatePaymentDto) {
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

    if (!['READY_FOR_CHECKOUT', 'OPEN'].includes(sale.status)) {
      throw new BadRequestException({
        code: 'SALE_NOT_READY_FOR_PAYMENT',
        title: 'Venda indisponível para pagamento',
        message: 'Somente vendas abertas ou prontas para checkout podem receber pagamento.',
        recommendedAction: 'Revise o status da venda antes de tentar novamente.',
      });
    }

    if ((dto.isDeferred ?? dto.method === 'DEFERRED') && !dto.deferredDueDate) {
      throw new BadRequestException({
        code: 'DEFERRED_DUE_DATE_REQUIRED',
        title: 'Vencimento obrigatório',
        message: 'Pagamentos diferidos precisam de uma data de vencimento.',
        recommendedAction: 'Informe a data de vencimento antes de continuar.',
      });
    }

    if (dto.cashRegisterId) {
      const cashRegister = await this.prisma.cashRegister.findFirst({
        where: { id: dto.cashRegisterId, tenantId },
      });

      if (!cashRegister || cashRegister.status !== 'OPEN') {
        throw new BadRequestException({
          code: 'CASH_REGISTER_INVALID',
          title: 'Caixa inválido',
          message: 'O caixa informado não está aberto ou não existe.',
          recommendedAction: 'Abra um caixa válido antes de receber o pagamento.',
        });
      }
    }

    return this.prisma.payment.create({
      data: {
        tenantId,
        unitId,
        saleId: dto.saleId,
        cashRegisterId: dto.cashRegisterId,
        method: dto.method as any,
        amount: dto.amount,
        isDeferred: dto.isDeferred ?? dto.method === 'DEFERRED',
        deferredDueDate: dto.deferredDueDate ? new Date(dto.deferredDueDate) : null,
        externalReference: dto.externalReference,
        notes: dto.notes,
      },
    });
  }

  async markPaid(tenantId: string, paymentId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, tenantId },
      include: { sale: true },
    });

    if (!payment) {
      throw new NotFoundException({
        code: 'PAYMENT_NOT_FOUND',
        title: 'Pagamento não encontrado',
        message: 'Não encontramos o pagamento informado.',
        recommendedAction: 'Atualize a tela e tente novamente.',
      });
    }

    if (payment.status === 'PAID') {
      throw new BadRequestException({
        code: 'PAYMENT_ALREADY_PAID',
        title: 'Pagamento já recebido',
        message: 'Este pagamento já foi marcado como pago.',
        recommendedAction: 'Atualize a tela antes de tentar novamente.',
      });
    }

    if (payment.status === 'CANCELED') {
      throw new BadRequestException({
        code: 'PAYMENT_ALREADY_CANCELED',
        title: 'Pagamento cancelado',
        message: 'Não é possível receber um pagamento cancelado.',
        recommendedAction: 'Revise o histórico antes de tentar novamente.',
      });
    }

    const updated = await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
      },
    });

    const allPaid = await this.prisma.payment.findMany({
      where: { saleId: payment.saleId, tenantId, status: 'PAID' },
    });

    const totalPaid = allPaid.reduce((acc, p) => acc + Number(p.amount), 0);
    const saleTotal = Number(payment.sale.totalAmount);

    if (totalPaid >= saleTotal) {
      await this.prisma.sale.update({
        where: { id: payment.saleId },
        data: { status: 'COMPLETED' },
      });
    }

    return updated;
  }

  private async findTerminalCheckedPayment(tenantId: string, paymentId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, tenantId },
    });

    if (!payment) {
      throw new NotFoundException({
        code: 'PAYMENT_NOT_FOUND',
        title: 'Pagamento não encontrado',
        message: 'Não encontramos o pagamento informado.',
        recommendedAction: 'Atualize a tela e tente novamente.',
      });
    }

    if (payment.status === 'PAID') {
      throw new BadRequestException({
        code: 'PAYMENT_ALREADY_PAID',
        title: 'Pagamento já recebido',
        message: 'Este pagamento já foi marcado como pago.',
        recommendedAction: 'Atualize a tela antes de tentar novamente.',
      });
    }

    if (payment.status === 'CANCELED') {
      throw new BadRequestException({
        code: 'PAYMENT_ALREADY_CANCELED',
        title: 'Pagamento cancelado',
        message: 'Este pagamento já foi cancelado.',
        recommendedAction: 'Revise o histórico antes de tentar novamente.',
      });
    }

    if (payment.status === 'FAILED') {
      throw new BadRequestException({
        code: 'PAYMENT_ALREADY_FAILED',
        title: 'Pagamento com falha registrada',
        message: 'Este pagamento já está marcado como falho.',
        recommendedAction: 'Revise o histórico antes de tentar novamente.',
      });
    }

    return payment;
  }

  async markFailed(tenantId: string, paymentId: string, dto: MarkFailedPaymentDto) {
    const payment = await this.findTerminalCheckedPayment(tenantId, paymentId);

    return this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'FAILED',
        errorCode: dto.errorCode ?? null,
        errorMessage: dto.errorMessage ?? null,
      },
    });
  }

  async cancel(tenantId: string, paymentId: string) {
    const payment = await this.findTerminalCheckedPayment(tenantId, paymentId);

    return this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'CANCELED',
        canceledAt: new Date(),
      },
    });
  }
}
