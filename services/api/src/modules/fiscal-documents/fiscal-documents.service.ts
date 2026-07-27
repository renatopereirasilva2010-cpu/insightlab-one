import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  FiscalDocumentEventType,
  FiscalDocumentSourceType,
  FiscalDocumentStatus,
  FiscalDocumentType,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateFiscalDocumentDto } from './dto/create-fiscal-document.dto';
import { QueryFiscalDocumentsDto } from './dto/query-fiscal-documents.dto';
import { UpdateFiscalDocumentStatusDto } from './dto/update-fiscal-document-status.dto';

type SaleSourceRecord = Prisma.SaleGetPayload<{
  include: {
    unit: true;
    items: {
      include: {
        service: true;
      };
    };
  };
}>;

type PaymentSourceRecord = Prisma.PaymentGetPayload<{
  include: {
    unit: true;
    sale: {
      include: {
        unit: true;
        items: {
          include: {
            service: true;
          };
        };
      };
    };
  };
}>;

const FISCAL_DOCUMENT_STATUS_TRANSITIONS: Record<
  FiscalDocumentStatus,
  FiscalDocumentStatus[]
> = {
  [FiscalDocumentStatus.DRAFT]: [FiscalDocumentStatus.REQUESTED],
  [FiscalDocumentStatus.REQUESTED]: [
    FiscalDocumentStatus.AUTHORIZED,
    FiscalDocumentStatus.FAILED,
  ],
  [FiscalDocumentStatus.AUTHORIZED]: [FiscalDocumentStatus.CANCELED],
  [FiscalDocumentStatus.CANCELED]: [],
  [FiscalDocumentStatus.FAILED]: [],
};

@Injectable()
export class FiscalDocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(tenantId: string, query: QueryFiscalDocumentsDto) {
    const where: Prisma.FiscalDocumentWhereInput = {
      tenantId,
    };

    if (query.sourceType) {
      where.sourceType = this.parseSourceType(query.sourceType);
    }

    if (query.sourceId) {
      where.sourceId = query.sourceId;
    }

    if (query.documentType) {
      where.documentType = this.parseDocumentType(query.documentType);
    }

    if (query.status) {
      where.status = this.parseStatusFilter(query.status);
    }

    if (query.referenceNumber) {
      where.referenceNumber = query.referenceNumber;
    }

    if (query.accessKey) {
      where.accessKey = query.accessKey;
    }

    return this.prisma.fiscalDocument.findMany({
      where,
      include: {
        events: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async detail(tenantId: string, id: string) {
    const fiscalDocument = await this.prisma.fiscalDocument.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        events: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!fiscalDocument) {
      throw new NotFoundException({
        code: 'FISCAL_DOCUMENT_NOT_FOUND',
        title: 'Documento fiscal não encontrado',
        message: 'Não encontramos o documento fiscal informado.',
        recommendedAction: 'Revise o identificador e tente novamente.',
      });
    }

    return fiscalDocument;
  }

    async create(
    tenantId: string,
    userUnitId: string | null,
    dto: CreateFiscalDocumentDto,
  ) {
    if (dto.sourceType === 'MANUAL') {
      throw new BadRequestException({
        code: 'FISCAL_DOCUMENT_MANUAL_SOURCE_NOT_ALLOWED',
        title: 'Origem manual não permitida',
        message:
          'Documentos fiscais devem estar vinculados a uma venda ou pagamento real — lançamento manual sem origem não é permitido.',
        recommendedAction: 'Selecione a venda ou o pagamento de origem do documento fiscal.',
      });
    }

    const sourceType = this.parseSourceType(dto.sourceType);
    const documentType = this.parseDocumentType(dto.documentType);

    const existingDocument = await this.prisma.fiscalDocument.findFirst({
      where: {
        tenantId,
        sourceType,
        sourceId: dto.sourceId,
        documentType,
      },
    });

    if (existingDocument) {
      throw new BadRequestException({
        code: 'FISCAL_DOCUMENT_DUPLICATE',
        title: 'Documento fiscal duplicado',
        message:
          'Já existe um documento fiscal para o mesmo tenant, sourceType, sourceId e documentType.',
        recommendedAction:
          'Revise a origem fiscal informada ou reutilize o documento já existente.',
      });
    }

    const createContext = await this.resolveCreateContext(
      tenantId,
      userUnitId,
      sourceType,
      dto,
    );

    try {
      return await this.prisma.fiscalDocument.create({
        data: {
          tenantId,
          unitId: createContext.unitId,
          sourceType,
          sourceId: dto.sourceId,
          documentType,
          provider: dto.provider ?? null,
          events: {
            create: {
              eventType: FiscalDocumentEventType.CREATED,
              message: 'Documento fiscal registrado no sistema.',
              payload: createContext.payload,
            },
          },
        },
        include: {
          events: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException({
          code: 'FISCAL_DOCUMENT_DUPLICATE',
          title: 'Documento fiscal duplicado',
          message:
            'Já existe um documento fiscal para o mesmo tenant, sourceType, sourceId e documentType.',
          recommendedAction:
            'Revise a origem fiscal informada ou reutilize o documento já existente.',
        });
      }

      throw error;
    }
  }

  async updateStatus(
    tenantId: string,
    id: string,
    dto: UpdateFiscalDocumentStatusDto,
  ) {
    const fiscalDocument = await this.prisma.fiscalDocument.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!fiscalDocument) {
      throw new NotFoundException({
        code: 'FISCAL_DOCUMENT_NOT_FOUND',
        title: 'Documento fiscal não encontrado',
        message: 'Não encontramos o documento fiscal informado.',
        recommendedAction: 'Revise o identificador e tente novamente.',
      });
    }

    const nextStatus = this.parseStatus(dto.status);
    this.assertTransitionAllowed(fiscalDocument.status, nextStatus);

    const { eventType, defaultMessage } = this.mapEventForStatus(nextStatus);
    const now = new Date();

    const payload: Prisma.InputJsonValue = {
      previousStatus: fiscalDocument.status,
      nextStatus,
      referenceNumber: dto.referenceNumber ?? null,
      accessKey: dto.accessKey ?? null,
      errorCode: dto.errorCode ?? null,
      errorMessage: dto.errorMessage ?? null,
    };

    const data: Prisma.FiscalDocumentUpdateInput = {
      status: nextStatus,
      events: {
        create: {
          eventType,
          message: dto.message ?? defaultMessage,
          payload,
        },
      },
    };

    if (dto.referenceNumber !== undefined) {
      data.referenceNumber = dto.referenceNumber;
    }

    if (dto.accessKey !== undefined) {
      data.accessKey = dto.accessKey;
    }

    if (nextStatus === FiscalDocumentStatus.REQUESTED) {
      data.requestedAt = now;
    }

    if (nextStatus === FiscalDocumentStatus.AUTHORIZED) {
      data.authorizedAt = now;
    }

    if (nextStatus === FiscalDocumentStatus.CANCELED) {
      data.canceledAt = now;
    }

    if (nextStatus === FiscalDocumentStatus.FAILED) {
      if (dto.errorCode !== undefined) {
        data.errorCode = dto.errorCode;
      }

      if (dto.errorMessage !== undefined) {
        data.errorMessage = dto.errorMessage;
      }
    }

    return this.prisma.fiscalDocument.update({
      where: { id: fiscalDocument.id },
      data,
      include: {
        events: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  private async resolveCreateContext(
    tenantId: string,
    userUnitId: string | null,
    sourceType: FiscalDocumentSourceType,
    dto: CreateFiscalDocumentDto,
  ): Promise<{
    unitId: string | null;
    payload: Prisma.InputJsonValue;
  }> {
    switch (sourceType) {
      case FiscalDocumentSourceType.SALE:
        return this.resolveSaleCreateContext(tenantId, dto);

      case FiscalDocumentSourceType.PAYMENT:
        return this.resolvePaymentCreateContext(tenantId, dto);

      default:
        throw new BadRequestException({
          code: 'FISCAL_DOCUMENT_INVALID_SOURCE_TYPE',
          title: 'sourceType inválido',
          message: 'sourceType deve ser SALE ou PAYMENT.',
          recommendedAction:
            'Revise o tipo de origem do documento fiscal e tente novamente.',
        });
    }
  }

  private async resolveSaleCreateContext(
    tenantId: string,
    dto: CreateFiscalDocumentDto,
  ): Promise<{
    unitId: string | null;
    payload: Prisma.InputJsonValue;
  }> {
    const sale = await this.prisma.sale.findFirst({
      where: {
        id: dto.sourceId,
        tenantId,
      },
      include: {
        unit: true,
        items: {
          include: {
            service: true,
          },
        },
      },
    });

    if (!sale) {
      throw new NotFoundException({
        code: 'FISCAL_DOCUMENT_SOURCE_NOT_FOUND',
        title: 'Origem fiscal não encontrada',
        message:
          'Não encontramos a venda informada para gerar o documento fiscal.',
        recommendedAction: 'Revise o sourceType/sourceId e tente novamente.',
      });
    }

    return {
      unitId: sale.unitId ?? null,
      payload: {
        sourceType: dto.sourceType,
        sourceId: dto.sourceId,
        documentType: dto.documentType,
        provider: dto.provider ?? null,
        sale: this.buildSaleSnapshot(sale),
        unit: this.buildUnitSnapshot(sale.unit),
        services: this.buildServiceSnapshots(sale.items),
      },
    };
  }

  private async resolvePaymentCreateContext(
    tenantId: string,
    dto: CreateFiscalDocumentDto,
  ): Promise<{
    unitId: string | null;
    payload: Prisma.InputJsonValue;
  }> {
    const payment = await this.prisma.payment.findFirst({
      where: {
        id: dto.sourceId,
        tenantId,
      },
      include: {
        unit: true,
        sale: {
          include: {
            unit: true,
            items: {
              include: {
                service: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException({
        code: 'FISCAL_DOCUMENT_SOURCE_NOT_FOUND',
        title: 'Origem fiscal não encontrada',
        message:
          'Não encontramos o pagamento informado para gerar o documento fiscal.',
        recommendedAction: 'Revise o sourceType/sourceId e tente novamente.',
      });
    }

    const resolvedUnit = payment.unit ?? payment.sale.unit ?? null;

    return {
      unitId: payment.unitId ?? payment.sale.unitId ?? null,
      payload: {
        sourceType: dto.sourceType,
        sourceId: dto.sourceId,
        documentType: dto.documentType,
        provider: dto.provider ?? null,
        payment: this.buildPaymentSnapshot(payment),
        sale: this.buildSaleSnapshot(payment.sale),
        unit: this.buildUnitSnapshot(resolvedUnit),
        services: this.buildServiceSnapshots(payment.sale.items),
      },
    };
  }

  private buildSaleSnapshot(sale: SaleSourceRecord) {
    return {
      id: sale.id,
      status: sale.status,
      attendanceId: sale.attendanceId ?? null,
      clientId: sale.clientId ?? null,
      professionalId: sale.professionalId ?? null,
      subtotal: Number(sale.subtotal),
      discountAmount: Number(sale.discountAmount),
      totalAmount: Number(sale.totalAmount),
      itemCount: sale.items.length,
      notes: sale.notes ?? null,
      createdAt: sale.createdAt.toISOString(),
    };
  }

  private buildPaymentSnapshot(payment: PaymentSourceRecord) {
    return {
      id: payment.id,
      saleId: payment.saleId,
      status: payment.status,
      method: payment.method,
      amount: Number(payment.amount),
      isDeferred: payment.isDeferred,
      deferredDueDate: payment.deferredDueDate
        ? payment.deferredDueDate.toISOString()
        : null,
      externalReference: payment.externalReference ?? null,
      paidAt: payment.paidAt ? payment.paidAt.toISOString() : null,
      createdAt: payment.createdAt.toISOString(),
    };
  }

  private buildUnitSnapshot(
    unit:
      | {
          id: string;
          legalName: string | null;
          tradeName: string | null;
          cnpj: string | null;
          municipalRegistration: string | null;
          city: string | null;
          state: string | null;
          ibgeCityCode: string | null;
        }
      | null
      | undefined,
  ) {
    if (!unit) {
      return null;
    }

    return {
      id: unit.id,
      legalName: unit.legalName ?? null,
      tradeName: unit.tradeName ?? null,
      cnpj: unit.cnpj ?? null,
      municipalRegistration: unit.municipalRegistration ?? null,
      city: unit.city ?? null,
      state: unit.state ?? null,
      ibgeCityCode: unit.ibgeCityCode ?? null,
    };
  }

  private buildServiceSnapshots(
    items: Array<{
      service:
        | {
            id: string;
            name: string;
            cnaeCode: string | null;
            serviceListItemCode: string | null;
            issRate: Prisma.Decimal | null;
          }
        | null;
    }>,
  ) {
    const services = new Map<
      string,
      {
        id: string;
        name: string;
        cnaeCode: string | null;
        serviceListItemCode: string | null;
        issRate: number | null;
      }
    >();

    for (const item of items) {
      if (!item.service) {
        continue;
      }

      services.set(item.service.id, {
        id: item.service.id,
        name: item.service.name,
        cnaeCode: item.service.cnaeCode ?? null,
        serviceListItemCode: item.service.serviceListItemCode ?? null,
        issRate:
          item.service.issRate !== null ? Number(item.service.issRate) : null,
      });
    }

    return Array.from(services.values());
  }

  private parseSourceType(value: string): FiscalDocumentSourceType {
    switch (value) {
      case 'SALE':
        return FiscalDocumentSourceType.SALE;
      case 'PAYMENT':
        return FiscalDocumentSourceType.PAYMENT;
      case 'MANUAL':
        return FiscalDocumentSourceType.MANUAL;
      default:
        throw new BadRequestException({
          code: 'FISCAL_DOCUMENT_INVALID_SOURCE_TYPE',
          title: 'sourceType inválido',
          message: 'sourceType deve ser SALE, PAYMENT ou MANUAL.',
          recommendedAction:
            'Revise o tipo de origem do documento fiscal e tente novamente.',
        });
    }
  }

  private parseDocumentType(value: string): FiscalDocumentType {
    switch (value) {
      case 'NFSE':
        return FiscalDocumentType.NFSE;
      case 'NFE':
        return FiscalDocumentType.NFE;
      case 'NFCE':
        return FiscalDocumentType.NFCE;
      default:
        throw new BadRequestException({
          code: 'FISCAL_DOCUMENT_INVALID_DOCUMENT_TYPE',
          title: 'documentType inválido',
          message: 'documentType deve ser NFSE, NFE ou NFCE.',
          recommendedAction:
            'Revise o tipo de documento fiscal e tente novamente.',
        });
    }
  }

  private parseStatus(value: string): FiscalDocumentStatus {
    switch (value) {
      case 'REQUESTED':
        return FiscalDocumentStatus.REQUESTED;
      case 'AUTHORIZED':
        return FiscalDocumentStatus.AUTHORIZED;
      case 'FAILED':
        return FiscalDocumentStatus.FAILED;
      case 'CANCELED':
        return FiscalDocumentStatus.CANCELED;
      default:
        throw new BadRequestException({
          code: 'FISCAL_DOCUMENT_INVALID_STATUS',
          title: 'status inválido',
          message: 'status deve ser REQUESTED, AUTHORIZED, FAILED ou CANCELED.',
          recommendedAction:
            'Revise o status informado para a transição fiscal e tente novamente.',
        });
    }
  }

  private parseStatusFilter(value: string): FiscalDocumentStatus {
    switch (value) {
      case 'DRAFT':
        return FiscalDocumentStatus.DRAFT;
      case 'REQUESTED':
        return FiscalDocumentStatus.REQUESTED;
      case 'AUTHORIZED':
        return FiscalDocumentStatus.AUTHORIZED;
      case 'FAILED':
        return FiscalDocumentStatus.FAILED;
      case 'CANCELED':
        return FiscalDocumentStatus.CANCELED;
      default:
        throw new BadRequestException({
          code: 'FISCAL_DOCUMENT_INVALID_STATUS',
          title: 'status inválido',
          message:
            'status deve ser DRAFT, REQUESTED, AUTHORIZED, FAILED ou CANCELED.',
          recommendedAction:
            'Revise o filtro de status fiscal e tente novamente.',
        });
    }
  }

  private assertTransitionAllowed(
    currentStatus: FiscalDocumentStatus,
    nextStatus: FiscalDocumentStatus,
  ) {
    if (currentStatus === nextStatus) {
      throw new BadRequestException({
        code: 'FISCAL_DOCUMENT_ALREADY_IN_STATUS',
        title: 'Documento fiscal já está neste status',
        message: `O documento fiscal já está com status ${currentStatus}.`,
        recommendedAction: 'Informe um novo status válido para continuar.',
      });
    }

    const allowedTransitions =
      FISCAL_DOCUMENT_STATUS_TRANSITIONS[currentStatus] ?? [];

    if (!allowedTransitions.includes(nextStatus)) {
      throw new BadRequestException({
        code: 'FISCAL_DOCUMENT_INVALID_STATUS_TRANSITION',
        title: 'Transição de status inválida',
        message: `Não é permitido mudar o documento fiscal de ${currentStatus} para ${nextStatus}.`,
        recommendedAction:
          'Revise a sequência de status fiscal e tente novamente.',
      });
    }
  }

  private mapEventForStatus(status: FiscalDocumentStatus): {
    eventType: FiscalDocumentEventType;
    defaultMessage: string;
  } {
    switch (status) {
      case FiscalDocumentStatus.REQUESTED:
        return {
          eventType: FiscalDocumentEventType.REQUESTED,
          defaultMessage: 'Emissão fiscal solicitada.',
        };
      case FiscalDocumentStatus.AUTHORIZED:
        return {
          eventType: FiscalDocumentEventType.AUTHORIZED,
          defaultMessage: 'Documento fiscal autorizado.',
        };
      case FiscalDocumentStatus.FAILED:
        return {
          eventType: FiscalDocumentEventType.ERROR,
          defaultMessage: 'Falha no processamento do documento fiscal.',
        };
      case FiscalDocumentStatus.CANCELED:
        return {
          eventType: FiscalDocumentEventType.CANCELED,
          defaultMessage: 'Documento fiscal cancelado.',
        };
      default:
        throw new BadRequestException({
          code: 'FISCAL_DOCUMENT_INVALID_STATUS',
          title: 'status inválido',
          message: 'Não foi possível mapear o evento para o status informado.',
          recommendedAction:
            'Revise o status fiscal informado e tente novamente.',
        });
    }
  }
}