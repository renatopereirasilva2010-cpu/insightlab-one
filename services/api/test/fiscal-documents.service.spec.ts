import { FiscalDocumentEventType, FiscalDocumentSourceType, FiscalDocumentStatus, FiscalDocumentType } from '@prisma/client';
import { PrismaService } from '../src/database/prisma.service';
import { FiscalDocumentsService } from '../src/modules/fiscal-documents/fiscal-documents.service';
import { FiscalProvider } from '../src/modules/fiscal-documents/providers/fiscal-provider.interface';

describe('FiscalDocumentsService', () => {
  let service: FiscalDocumentsService;
  let fiscalProvider: { requestEmission: jest.Mock };
  let prisma: {
    fiscalDocument: {
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    fiscalDocumentEvent: {
      create: jest.Mock;
    };
    sale: {
      findFirst: jest.Mock;
    };
    payment: {
      findFirst: jest.Mock;
    };
  };

  beforeEach(() => {
    prisma = {
      fiscalDocument: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      fiscalDocumentEvent: {
        create: jest.fn(),
      },
      sale: {
        findFirst: jest.fn(),
      },
      payment: {
        findFirst: jest.fn(),
      },
    };

    fiscalProvider = { requestEmission: jest.fn() };

    service = new FiscalDocumentsService(
      prisma as unknown as PrismaService,
      fiscalProvider as unknown as FiscalProvider,
    );
    jest.useRealTimers();
  });

  const saleFixture = {
    id: 'sale-1',
    unitId: 'unit_1',
    status: 'COMPLETED',
    attendanceId: null,
    clientId: 'client-1',
    professionalId: 'prof-1',
    subtotal: 100,
    discountAmount: 0,
    totalAmount: 100,
    notes: null,
    createdAt: new Date('2026-04-04T12:00:00.000Z'),
    unit: null,
    items: [],
  };

  it('creates a fiscal document linked to a sale in DRAFT with CREATED event', async () => {
    prisma.fiscalDocument.findFirst.mockResolvedValueOnce(null);
    prisma.sale.findFirst.mockResolvedValueOnce(saleFixture);

    prisma.fiscalDocument.create.mockImplementation(async (args) => ({
      id: 'fd_1',
      tenantId: 'tenant_1',
      unitId: 'unit_1',
      sourceType: FiscalDocumentSourceType.SALE,
      sourceId: 'sale-1',
      documentType: FiscalDocumentType.NFSE,
      status: FiscalDocumentStatus.DRAFT,
      provider: 'SMOKE_TEST',
      referenceNumber: null,
      accessKey: null,
      errorCode: null,
      errorMessage: null,
      requestedAt: null,
      authorizedAt: null,
      canceledAt: null,
      createdAt: new Date('2026-04-04T12:00:00.000Z'),
      updatedAt: new Date('2026-04-04T12:00:00.000Z'),
      events: [
        {
          id: 'fde_1',
          fiscalDocumentId: 'fd_1',
          eventType: FiscalDocumentEventType.CREATED,
          message: 'Documento fiscal registrado no sistema.',
          payload: (args.data as any).events.create.payload,
          createdAt: new Date('2026-04-04T12:00:00.000Z'),
        },
      ],
    }));

    const result = await service.create('tenant_1', 'unit_1', {
      sourceType: 'SALE',
      sourceId: 'sale-1',
      documentType: 'NFSE',
      provider: 'SMOKE_TEST',
    });

    expect(prisma.fiscalDocument.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId: 'tenant_1',
          unitId: 'unit_1',
          sourceType: FiscalDocumentSourceType.SALE,
          sourceId: 'sale-1',
          documentType: FiscalDocumentType.NFSE,
          provider: 'SMOKE_TEST',
          events: {
            create: expect.objectContaining({
              eventType: FiscalDocumentEventType.CREATED,
              message: 'Documento fiscal registrado no sistema.',
            }),
          },
        }),
        include: {
          events: {
            orderBy: { createdAt: 'asc' },
          },
        },
      }),
    );

    expect(result.status).toBe(FiscalDocumentStatus.DRAFT);
    expect(result.events).toHaveLength(1);
    expect(result.events[0].eventType).toBe(FiscalDocumentEventType.CREATED);
  });

  it('blocks duplicate fiscal document before create', async () => {
    prisma.fiscalDocument.findFirst.mockResolvedValueOnce({
      id: 'fd_existing',
    });
    prisma.sale.findFirst.mockResolvedValueOnce(saleFixture);

    await expect(
      service.create('tenant_1', 'unit_1', {
        sourceType: 'SALE',
        sourceId: 'sale-1',
        documentType: 'NFSE',
      }),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        code: 'FISCAL_DOCUMENT_DUPLICATE',
      }),
    });

    expect(prisma.fiscalDocument.create).not.toHaveBeenCalled();
  });

  it('rejects MANUAL sourceType on create - fiscal documents must be linked to a real sale or payment', async () => {
    await expect(
      service.create('tenant_1', 'unit_1', {
        sourceType: 'MANUAL',
        sourceId: 'manual-1',
        documentType: 'NFSE',
      }),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        code: 'FISCAL_DOCUMENT_MANUAL_SOURCE_NOT_ALLOWED',
      }),
    });

    expect(prisma.fiscalDocument.create).not.toHaveBeenCalled();
  });

  it('rejects OTHER as an invalid documentType', async () => {
    prisma.fiscalDocument.findFirst.mockResolvedValueOnce(null);
    prisma.sale.findFirst.mockResolvedValueOnce(saleFixture);

    await expect(
      service.create('tenant_1', 'unit_1', {
        sourceType: 'SALE',
        sourceId: 'sale-1',
        documentType: 'OTHER',
      }),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        code: 'FISCAL_DOCUMENT_INVALID_DOCUMENT_TYPE',
      }),
    });

    expect(prisma.fiscalDocument.create).not.toHaveBeenCalled();
  });

  it('updates status from DRAFT to REQUESTED and writes REQUESTED event payload', async () => {
    const now = new Date('2026-04-04T15:00:00.000Z');
    jest.useFakeTimers().setSystemTime(now);

    prisma.fiscalDocument.findFirst.mockResolvedValueOnce({
      id: 'fd_1',
      tenantId: 'tenant_1',
      status: FiscalDocumentStatus.DRAFT,
    });

    prisma.fiscalDocument.update.mockImplementation(async (args) => ({
      id: 'fd_1',
      tenantId: 'tenant_1',
      status: FiscalDocumentStatus.REQUESTED,
      requestedAt: now,
      authorizedAt: null,
      canceledAt: null,
      referenceNumber: null,
      accessKey: null,
      errorCode: null,
      errorMessage: null,
      events: [
        {
          eventType: FiscalDocumentEventType.REQUESTED,
          message: 'Solicitacao enviada.',
          payload: (args.data as any).events.create.payload,
        },
      ],
    }));

    const result = await service.updateStatus('tenant_1', 'fd_1', {
      status: 'REQUESTED',
      message: 'Solicitacao enviada.',
    });

    expect(prisma.fiscalDocument.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'fd_1' },
        data: expect.objectContaining({
          status: FiscalDocumentStatus.REQUESTED,
          requestedAt: now,
          events: {
            create: expect.objectContaining({
              eventType: FiscalDocumentEventType.REQUESTED,
              message: 'Solicitacao enviada.',
              payload: expect.objectContaining({
                previousStatus: FiscalDocumentStatus.DRAFT,
                nextStatus: FiscalDocumentStatus.REQUESTED,
                referenceNumber: null,
                accessKey: null,
                errorCode: null,
                errorMessage: null,
              }),
            }),
          },
        }),
        include: {
          events: {
            orderBy: { createdAt: 'asc' },
          },
        },
      }),
    );

    expect(result.status).toBe(FiscalDocumentStatus.REQUESTED);
  });

  it('blocks invalid transition from DRAFT to AUTHORIZED', async () => {
    prisma.fiscalDocument.findFirst.mockResolvedValueOnce({
      id: 'fd_1',
      tenantId: 'tenant_1',
      status: FiscalDocumentStatus.DRAFT,
    });

    await expect(
      service.updateStatus('tenant_1', 'fd_1', {
        status: 'AUTHORIZED',
      }),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        code: 'FISCAL_DOCUMENT_INVALID_STATUS_TRANSITION',
      }),
    });

    expect(prisma.fiscalDocument.update).not.toHaveBeenCalled();
  });
    it('updates status from REQUESTED to AUTHORIZED and records authorization fields', async () => {
    const now = new Date('2026-04-04T16:00:00.000Z');
    jest.useFakeTimers().setSystemTime(now);

    prisma.fiscalDocument.findFirst.mockResolvedValueOnce({
      id: 'fd_2',
      tenantId: 'tenant_1',
      status: FiscalDocumentStatus.REQUESTED,
    });

    prisma.fiscalDocument.update.mockImplementation(async (args) => ({
      id: 'fd_2',
      tenantId: 'tenant_1',
      status: FiscalDocumentStatus.AUTHORIZED,
      requestedAt: new Date('2026-04-04T15:00:00.000Z'),
      authorizedAt: now,
      canceledAt: null,
      referenceNumber: 'NFSE-123',
      accessKey: 'ACCESS-KEY-123',
      errorCode: null,
      errorMessage: null,
      events: [
        {
          eventType: FiscalDocumentEventType.AUTHORIZED,
          message: 'Documento autorizado.',
          payload: (args.data as any).events.create.payload,
        },
      ],
    }));

    const result = await service.updateStatus('tenant_1', 'fd_2', {
      status: 'AUTHORIZED',
      message: 'Documento autorizado.',
      referenceNumber: 'NFSE-123',
      accessKey: 'ACCESS-KEY-123',
    });

    expect(prisma.fiscalDocument.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'fd_2' },
        data: expect.objectContaining({
          status: FiscalDocumentStatus.AUTHORIZED,
          authorizedAt: now,
          referenceNumber: 'NFSE-123',
          accessKey: 'ACCESS-KEY-123',
          events: {
            create: expect.objectContaining({
              eventType: FiscalDocumentEventType.AUTHORIZED,
              message: 'Documento autorizado.',
              payload: expect.objectContaining({
                previousStatus: FiscalDocumentStatus.REQUESTED,
                nextStatus: FiscalDocumentStatus.AUTHORIZED,
                referenceNumber: 'NFSE-123',
                accessKey: 'ACCESS-KEY-123',
                errorCode: null,
                errorMessage: null,
              }),
            }),
          },
        }),
      }),
    );

    expect(result.status).toBe(FiscalDocumentStatus.AUTHORIZED);
  });

  it('updates status from REQUESTED to FAILED and stores fiscal error details', async () => {
    prisma.fiscalDocument.findFirst.mockResolvedValueOnce({
      id: 'fd_3',
      tenantId: 'tenant_1',
      status: FiscalDocumentStatus.REQUESTED,
    });

    prisma.fiscalDocument.update.mockImplementation(async (args) => ({
      id: 'fd_3',
      tenantId: 'tenant_1',
      status: FiscalDocumentStatus.FAILED,
      requestedAt: new Date('2026-04-04T15:00:00.000Z'),
      authorizedAt: null,
      canceledAt: null,
      referenceNumber: 'TMP-999',
      accessKey: 'KEY-FAILED-999',
      errorCode: 'SEFAZ_TIMEOUT',
      errorMessage: 'Timeout na autorizacao.',
      events: [
        {
          eventType: FiscalDocumentEventType.ERROR,
          message: 'Falha fiscal.',
          payload: (args.data as any).events.create.payload,
        },
      ],
    }));

    const result = await service.updateStatus('tenant_1', 'fd_3', {
      status: 'FAILED',
      message: 'Falha fiscal.',
      referenceNumber: 'TMP-999',
      accessKey: 'KEY-FAILED-999',
      errorCode: 'SEFAZ_TIMEOUT',
      errorMessage: 'Timeout na autorizacao.',
    });

    expect(prisma.fiscalDocument.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'fd_3' },
        data: expect.objectContaining({
          status: FiscalDocumentStatus.FAILED,
          referenceNumber: 'TMP-999',
          accessKey: 'KEY-FAILED-999',
          errorCode: 'SEFAZ_TIMEOUT',
          errorMessage: 'Timeout na autorizacao.',
          events: {
            create: expect.objectContaining({
              eventType: FiscalDocumentEventType.ERROR,
              message: 'Falha fiscal.',
              payload: expect.objectContaining({
                previousStatus: FiscalDocumentStatus.REQUESTED,
                nextStatus: FiscalDocumentStatus.FAILED,
                referenceNumber: 'TMP-999',
                accessKey: 'KEY-FAILED-999',
                errorCode: 'SEFAZ_TIMEOUT',
                errorMessage: 'Timeout na autorizacao.',
              }),
            }),
          },
        }),
      }),
    );

    expect(result.status).toBe(FiscalDocumentStatus.FAILED);
  });

  it('updates status from AUTHORIZED to CANCELED and timestamps cancellation', async () => {
    const now = new Date('2026-04-04T17:00:00.000Z');
    jest.useFakeTimers().setSystemTime(now);

    prisma.fiscalDocument.findFirst.mockResolvedValueOnce({
      id: 'fd_4',
      tenantId: 'tenant_1',
      status: FiscalDocumentStatus.AUTHORIZED,
    });

    prisma.fiscalDocument.update.mockImplementation(async (args) => ({
      id: 'fd_4',
      tenantId: 'tenant_1',
      status: FiscalDocumentStatus.CANCELED,
      requestedAt: new Date('2026-04-04T15:00:00.000Z'),
      authorizedAt: new Date('2026-04-04T16:00:00.000Z'),
      canceledAt: now,
      referenceNumber: 'NFSE-321',
      accessKey: 'ACCESS-321',
      errorCode: null,
      errorMessage: null,
      events: [
        {
          eventType: FiscalDocumentEventType.CANCELED,
          message: 'Documento fiscal cancelado.',
          payload: (args.data as any).events.create.payload,
        },
      ],
    }));

    const result = await service.updateStatus('tenant_1', 'fd_4', {
      status: 'CANCELED',
    });

    expect(prisma.fiscalDocument.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'fd_4' },
        data: expect.objectContaining({
          status: FiscalDocumentStatus.CANCELED,
          canceledAt: now,
          events: {
            create: expect.objectContaining({
              eventType: FiscalDocumentEventType.CANCELED,
              message: 'Documento fiscal cancelado.',
              payload: expect.objectContaining({
                previousStatus: FiscalDocumentStatus.AUTHORIZED,
                nextStatus: FiscalDocumentStatus.CANCELED,
              }),
            }),
          },
        }),
      }),
    );

    expect(result.status).toBe(FiscalDocumentStatus.CANCELED);
  });

  it('blocks update when fiscal document is already in the requested status', async () => {
    prisma.fiscalDocument.findFirst.mockResolvedValueOnce({
      id: 'fd_5',
      tenantId: 'tenant_1',
      status: FiscalDocumentStatus.REQUESTED,
    });

    await expect(
      service.updateStatus('tenant_1', 'fd_5', {
        status: 'REQUESTED',
      }),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        code: 'FISCAL_DOCUMENT_ALREADY_IN_STATUS',
      }),
    });

    expect(prisma.fiscalDocument.update).not.toHaveBeenCalled();
  });

  describe('createDraftForCompletedSale', () => {
    it('creates a DRAFT NFSE document linked to the sale when none exists yet', async () => {
      prisma.fiscalDocument.findFirst.mockResolvedValueOnce(null);
      prisma.sale.findFirst.mockResolvedValueOnce(saleFixture);
      prisma.fiscalDocument.create.mockResolvedValueOnce({ id: 'fd_auto_1' });

      const result = await service.createDraftForCompletedSale('tenant_1', 'sale-1');

      expect(prisma.fiscalDocument.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId: 'tenant_1',
            unitId: 'unit_1',
            sourceType: FiscalDocumentSourceType.SALE,
            sourceId: 'sale-1',
            documentType: FiscalDocumentType.NFSE,
          }),
        }),
      );
      expect(result).toEqual({ id: 'fd_auto_1', isNew: true });
    });

    it('is idempotent - does not create a second document for the same sale', async () => {
      prisma.fiscalDocument.findFirst.mockResolvedValueOnce({ id: 'fd_existing' });

      const result = await service.createDraftForCompletedSale('tenant_1', 'sale-1');

      expect(prisma.fiscalDocument.create).not.toHaveBeenCalled();
      expect(result).toEqual({ id: 'fd_existing', isNew: false });
    });

    it('returns null and does not throw when the sale cannot be found', async () => {
      prisma.fiscalDocument.findFirst.mockResolvedValueOnce(null);
      prisma.sale.findFirst.mockResolvedValueOnce(null);

      const result = await service.createDraftForCompletedSale('tenant_1', 'missing-sale');

      expect(result).toBeNull();
      expect(prisma.fiscalDocument.create).not.toHaveBeenCalled();
    });
  });

  describe('advanceDraftEmission', () => {
    it('does nothing when the fiscal document is not in DRAFT', async () => {
      prisma.fiscalDocument.findFirst.mockResolvedValueOnce({
        id: 'fd_1',
        tenantId: 'tenant_1',
        status: FiscalDocumentStatus.REQUESTED,
      });

      await service.advanceDraftEmission('tenant_1', 'fd_1');

      expect(fiscalProvider.requestEmission).not.toHaveBeenCalled();
    });

    it('leaves the document in DRAFT and logs an event when the provider skips emission', async () => {
      prisma.fiscalDocument.findFirst.mockResolvedValueOnce({
        id: 'fd_1',
        tenantId: 'tenant_1',
        status: FiscalDocumentStatus.DRAFT,
      });
      fiscalProvider.requestEmission.mockResolvedValueOnce({
        type: 'skipped',
        reason: 'Nenhum provedor de emissão fiscal configurado ainda.',
      });

      await service.advanceDraftEmission('tenant_1', 'fd_1');

      expect(prisma.fiscalDocumentEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          fiscalDocumentId: 'fd_1',
          eventType: FiscalDocumentEventType.CREATED,
          message: 'Nenhum provedor de emissão fiscal configurado ainda.',
        }),
      });
      expect(prisma.fiscalDocument.update).not.toHaveBeenCalled();
    });

    it('moves the document to REQUESTED when the provider accepts the emission', async () => {
      prisma.fiscalDocument.findFirst
        .mockResolvedValueOnce({ id: 'fd_1', tenantId: 'tenant_1', status: FiscalDocumentStatus.DRAFT })
        .mockResolvedValueOnce({ id: 'fd_1', tenantId: 'tenant_1', status: FiscalDocumentStatus.DRAFT });
      fiscalProvider.requestEmission.mockResolvedValueOnce({
        type: 'requested',
        referenceNumber: 'NFSE-777',
        accessKey: 'ACCESS-777',
      });
      prisma.fiscalDocument.update.mockResolvedValueOnce({
        id: 'fd_1',
        status: FiscalDocumentStatus.REQUESTED,
        events: [],
      });

      await service.advanceDraftEmission('tenant_1', 'fd_1');

      expect(prisma.fiscalDocument.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: FiscalDocumentStatus.REQUESTED,
            referenceNumber: 'NFSE-777',
            accessKey: 'ACCESS-777',
          }),
        }),
      );
    });

    it('moves the document through REQUESTED to FAILED when the provider reports a failure', async () => {
      prisma.fiscalDocument.findFirst
        .mockResolvedValueOnce({ id: 'fd_1', tenantId: 'tenant_1', status: FiscalDocumentStatus.DRAFT })
        .mockResolvedValueOnce({ id: 'fd_1', tenantId: 'tenant_1', status: FiscalDocumentStatus.DRAFT })
        .mockResolvedValueOnce({ id: 'fd_1', tenantId: 'tenant_1', status: FiscalDocumentStatus.REQUESTED });
      fiscalProvider.requestEmission.mockResolvedValueOnce({
        type: 'failed',
        errorCode: 'PROVIDER_ERROR',
        errorMessage: 'Falha simulada do provedor.',
      });
      prisma.fiscalDocument.update
        .mockResolvedValueOnce({ id: 'fd_1', status: FiscalDocumentStatus.REQUESTED, events: [] })
        .mockResolvedValueOnce({ id: 'fd_1', status: FiscalDocumentStatus.FAILED, events: [] });

      await service.advanceDraftEmission('tenant_1', 'fd_1');

      expect(prisma.fiscalDocument.update).toHaveBeenCalledTimes(2);
      expect(prisma.fiscalDocument.update).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ data: expect.objectContaining({ status: FiscalDocumentStatus.REQUESTED }) }),
      );
      expect(prisma.fiscalDocument.update).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          data: expect.objectContaining({
            status: FiscalDocumentStatus.FAILED,
            errorCode: 'PROVIDER_ERROR',
            errorMessage: 'Falha simulada do provedor.',
          }),
        }),
      );
    });
  });
});