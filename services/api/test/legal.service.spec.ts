import { BadRequestException, NotFoundException } from '@nestjs/common';
import { LegalService } from '../src/modules/legal/legal.service';

describe('LegalService', () => {
  const termsDoc = { id: 'terms-v1', type: 'TERMS_OF_USE', version: 'v1' };
  const privacyDoc = { id: 'privacy-v1', type: 'PRIVACY_POLICY', version: 'v1' };

  function buildPrisma(overrides: Record<string, any> = {}) {
    return {
      legalDocument: {
        findFirst: jest.fn().mockImplementation(({ where }: any) =>
          Promise.resolve(where.type === 'TERMS_OF_USE' ? termsDoc : privacyDoc),
        ),
      },
      consentRecord: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation(({ data }) => ({ id: 'consent-1', ...data })),
      },
      dataSubjectRequest: {
        create: jest.fn().mockImplementation(({ data }) => ({ id: 'dsr-1', ...data })),
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn().mockImplementation(({ data }) => ({ id: 'dsr-1', ...data })),
      },
      tenant: {
        findUnique: jest.fn().mockResolvedValue({ id: 'tenant-1', slug: 'mix-demo', status: 'ACTIVE' }),
      },
      ...overrides,
    };
  }

  describe('getCurrentDocument', () => {
    it('throws NotFoundException when no active document exists for the type', async () => {
      const prisma = buildPrisma({ legalDocument: { findFirst: jest.fn().mockResolvedValue(null) } });
      const service = new LegalService(prisma as any);

      await expect(service.getCurrentDocument('TERMS_OF_USE' as any)).rejects.toThrow(NotFoundException);
    });

    it('returns the active document for the requested type', async () => {
      const prisma = buildPrisma();
      const service = new LegalService(prisma as any);

      const result = await service.getCurrentDocument('PRIVACY_POLICY' as any);

      expect(result).toEqual(privacyDoc);
    });
  });

  describe('acceptConsent', () => {
    it('creates a ConsentRecord for a USER on first acceptance', async () => {
      const prisma = buildPrisma();
      const service = new LegalService(prisma as any);

      const result = await service.acceptConsent(
        'tenant-1',
        'user-1',
        'TERMS_OF_USE' as any,
        '127.0.0.1',
        'jest',
      );

      expect(prisma.consentRecord.create).toHaveBeenCalledWith({
        data: {
          tenantId: 'tenant-1',
          subjectType: 'USER',
          subjectId: 'user-1',
          legalDocumentId: 'terms-v1',
          ipAddress: '127.0.0.1',
          userAgent: 'jest',
        },
      });
      expect(result).toEqual({ accepted: true, alreadyAccepted: false });
    });

    it('is idempotent - does not create a duplicate ConsentRecord when already accepted', async () => {
      const prisma = buildPrisma({
        consentRecord: {
          findFirst: jest.fn().mockResolvedValue({ id: 'existing' }),
          create: jest.fn(),
        },
      });
      const service = new LegalService(prisma as any);

      const result = await service.acceptConsent('tenant-1', 'user-1', 'TERMS_OF_USE' as any, null, null);

      expect(prisma.consentRecord.create).not.toHaveBeenCalled();
      expect(result).toEqual({ accepted: true, alreadyAccepted: true });
    });
  });

  describe('getOwnConsentStatus', () => {
    it('reports accepted:false for a document the user has not accepted yet', async () => {
      const prisma = buildPrisma();
      const service = new LegalService(prisma as any);

      const result = await service.getOwnConsentStatus('user-1');

      expect(result.termsOfUse).toEqual({ id: 'terms-v1', version: 'v1', accepted: false });
      expect(result.privacyPolicy).toEqual({ id: 'privacy-v1', version: 'v1', accepted: false });
    });

    it('reports accepted:true when a non-revoked ConsentRecord exists', async () => {
      const prisma = buildPrisma({
        consentRecord: { findFirst: jest.fn().mockResolvedValue({ id: 'existing' }) },
      });
      const service = new LegalService(prisma as any);

      const result = await service.getOwnConsentStatus('user-1');

      expect(result.termsOfUse?.accepted).toBe(true);
    });
  });

  describe('recordClientConsent', () => {
    it('never throws even if prisma fails', async () => {
      const prisma = buildPrisma({
        legalDocument: { findFirst: jest.fn().mockRejectedValue(new Error('db down')) },
      });
      const service = new LegalService(prisma as any);

      await expect(
        service.recordClientConsent('tenant-1', 'client-1', 'PRIVACY_POLICY' as any, null, null),
      ).resolves.toBeUndefined();
    });

    it('does nothing silently when no active document exists', async () => {
      const prisma = buildPrisma({ legalDocument: { findFirst: jest.fn().mockResolvedValue(null) } });
      const service = new LegalService(prisma as any);

      await service.recordClientConsent('tenant-1', 'client-1', 'PRIVACY_POLICY' as any, null, null);

      expect(prisma.consentRecord.create).not.toHaveBeenCalled();
    });

    it('creates a CLIENT ConsentRecord when a document exists', async () => {
      const prisma = buildPrisma();
      const service = new LegalService(prisma as any);

      await service.recordClientConsent('tenant-1', 'client-1', 'PRIVACY_POLICY' as any, '10.0.0.1', 'ua');

      expect(prisma.consentRecord.create).toHaveBeenCalledWith({
        data: {
          tenantId: 'tenant-1',
          subjectType: 'CLIENT',
          subjectId: 'client-1',
          legalDocumentId: 'privacy-v1',
          ipAddress: '10.0.0.1',
          userAgent: 'ua',
        },
      });
    });
  });

  describe('createDataSubjectRequest', () => {
    it('throws BadRequestException when the tenant slug does not resolve', async () => {
      const prisma = buildPrisma({ tenant: { findUnique: jest.fn().mockResolvedValue(null) } });
      const service = new LegalService(prisma as any);

      await expect(
        service.createDataSubjectRequest('missing', {
          requesterName: 'A',
          requesterContact: 'a@a.com',
          requestType: 'ACCESS',
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates the request scoped to the resolved tenant', async () => {
      const prisma = buildPrisma();
      const service = new LegalService(prisma as any);

      await service.createDataSubjectRequest('mix-demo', {
        requesterName: 'Cliente X',
        requesterContact: '11999990000',
        requestType: 'DELETION',
      } as any);

      expect(prisma.dataSubjectRequest.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: 'tenant-1',
          subjectType: 'CLIENT',
          requesterName: 'Cliente X',
          requestType: 'DELETION',
        }),
      });
    });
  });

  describe('updateDataSubjectRequest', () => {
    it('throws NotFoundException when the request does not exist for the tenant', async () => {
      const prisma = buildPrisma({ dataSubjectRequest: { findFirst: jest.fn().mockResolvedValue(null) } });
      const service = new LegalService(prisma as any);

      await expect(
        service.updateDataSubjectRequest('tenant-1', 'missing', { status: 'RESOLVED' } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('sets resolvedAt when transitioning to RESOLVED', async () => {
      const prisma = buildPrisma({
        dataSubjectRequest: {
          findFirst: jest.fn().mockResolvedValue({ id: 'dsr-1', status: 'OPEN', resolvedAt: null }),
          update: jest.fn().mockImplementation(({ data }) => ({ id: 'dsr-1', ...data })),
        },
      });
      const service = new LegalService(prisma as any);

      const result = await service.updateDataSubjectRequest('tenant-1', 'dsr-1', {
        status: 'RESOLVED',
        resolutionNotes: 'Dados excluídos.',
      } as any);

      expect(result.resolvedAt).toBeInstanceOf(Date);
    });

    it('does not set resolvedAt when transitioning to IN_PROGRESS', async () => {
      const prisma = buildPrisma({
        dataSubjectRequest: {
          findFirst: jest.fn().mockResolvedValue({ id: 'dsr-1', status: 'OPEN', resolvedAt: null }),
          update: jest.fn().mockImplementation(({ data }) => ({ id: 'dsr-1', ...data })),
        },
      });
      const service = new LegalService(prisma as any);

      const result = await service.updateDataSubjectRequest('tenant-1', 'dsr-1', {
        status: 'IN_PROGRESS',
      } as any);

      expect(result.resolvedAt).toBeNull();
    });
  });
});
