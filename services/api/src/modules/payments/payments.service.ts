import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { FiscalDocumentsService } from '../fiscal-documents/fiscal-documents.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { MarkFailedPaymentDto } from './dto/mark-failed-payment.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly fiscalDocumentsService: FiscalDocumentsService,
  ) {}

  findAllByTenant(tenantId: string) {
    return this.prisma.withTenant(tenantId, (tx) =>
      tx.payment.findMany({
        where: { tenantId },
        include: { sale: true, cashRegister: true },
        orderBy: { createdAt: 'desc' },
      }),
    );
  }

  async create(tenantId: string, unitId: string | null, dto: CreatePaymentDto) {
    return this.prisma.withTenant(tenantId, async (tx) => {
      const sale = await tx.sale.findFirst({
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

      const cashRegister = await tx.cashRegister.findFirst({
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

      return tx.payment.create({
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
    });
  }

  async markPaid(tenantId: string, paymentId: string) {
    let newFiscalDocumentId: string | null = null;

    const updated = await this.prisma.withTenant(tenantId, async (tx) => {
      const payment = await tx.payment.findFirst({
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

      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'PAID',
          paidAt: new Date(),
        },
      });

      const allPaid = await tx.payment.findMany({
        where: { saleId: payment.saleId, tenantId, status: 'PAID' },
      });

      const totalPaid = allPaid.reduce((acc, p) => acc + Number(p.amount), 0);
      const saleTotal = Number(payment.sale.totalAmount);

      if (totalPaid >= saleTotal) {
        await tx.sale.update({
          where: { id: payment.saleId },
          data: { status: 'COMPLETED' },
        });

        const draft = await this.fiscalDocumentsService.createDraftForCompletedSale(
          tenantId,
          payment.saleId,
          tx,
        );

        if (draft?.isNew) {
          newFiscalDocumentId = draft.id;
        }
      }

      return updatedPayment;
    });

    if (newFiscalDocumentId) {
      try {
        await this.fiscalDocumentsService.advanceDraftEmission(tenantId, newFiscalDocumentId);
      } catch (error) {
        // Emissao fiscal e best-effort aqui - o pagamento ja foi confirmado
        // e nao pode falhar por causa disso (risco documentado na ONDA 4).
        this.logger.error(
          `Falha ao tentar avançar o documento fiscal ${newFiscalDocumentId} após o pagamento.`,
          error instanceof Error ? error.stack : error,
        );
      }
    }

    return updated;
  }

  private async findTerminalCheckedPayment(tx: Prisma.TransactionClient, tenantId: string, paymentId: string) {
    const payment = await tx.payment.findFirst({
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
    return this.prisma.withTenant(tenantId, async (tx) => {
      const payment = await this.findTerminalCheckedPayment(tx, tenantId, paymentId);

      return tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          errorCode: dto.errorCode ?? null,
          errorMessage: dto.errorMessage ?? null,
        },
      });
    });
  }

  async cancel(tenantId: string, paymentId: string) {
    return this.prisma.withTenant(tenantId, async (tx) => {
      const payment = await this.findTerminalCheckedPayment(tx, tenantId, paymentId);

      return tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'CANCELED',
          canceledAt: new Date(),
        },
      });
    });
  }
}
