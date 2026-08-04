import { NotFoundException, BadRequestException } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { ClientImportService } from '../src/modules/admin-master/client-import.service';

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
}));

import { existsSync, readFileSync } from 'fs';

function buildClientBuffer(): Buffer {
  const aoa = [
    ['Nome', 'E-Mail', 'Telefones'],
    ['CLIENTE IMPORTAVEL', 'ok@example.com', '41988887777'],
    ['', 'sememail@example.com', ''], // NAO_IMPORTAVEL (sem nome)
  ];
  const sheet = XLSX.utils.aoa_to_sheet(aoa);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'Sheet1');
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}

describe('ClientImportService', () => {
  let service: ClientImportService;
  let prisma: {
    migrationJob: { findFirst: jest.Mock; update: jest.Mock };
    migrationBatch: { create: jest.Mock };
    client: { findMany: jest.Mock; create: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = {
      migrationJob: { findFirst: jest.fn(), update: jest.fn() },
      migrationBatch: { create: jest.fn() },
      client: { findMany: jest.fn().mockResolvedValue([]), create: jest.fn() },
      $transaction: jest.fn(),
    };
    service = new ClientImportService(prisma as any);
  });

  describe('analyze', () => {
    it('throws NotFoundException when the migration job does not belong to the tenant', async () => {
      prisma.migrationJob.findFirst.mockResolvedValue(null);

      await expect(
        service.analyze('tenant-1', 'job-x', { path: '/tmp/whatever' } as any, {}),
      ).rejects.toThrow(NotFoundException);
    });

    it('reads the uploaded file and returns a classified summary', async () => {
      prisma.migrationJob.findFirst.mockResolvedValue({ id: 'job-1', tenantId: 'tenant-1' });
      (readFileSync as jest.Mock).mockReturnValue(buildClientBuffer());

      const result = await service.analyze(
        'tenant-1',
        'job-1',
        { path: '/uploads/migrations/tenant-1/123-456.xlsx' } as any,
        {},
      );

      expect(result.recognized).toBe(true);
      expect(result.summary).toEqual({ importavel: 1, parcial: 0, duplicado: 0, naoImportavel: 1 });
      expect(result.fileToken).toBe('123-456.xlsx');
    });
  });

  describe('commit', () => {
    beforeEach(() => {
      prisma.migrationJob.findFirst.mockResolvedValue({ id: 'job-1', tenantId: 'tenant-1' });
      (existsSync as jest.Mock).mockReturnValue(true);
      (readFileSync as jest.Mock).mockReturnValue(buildClientBuffer());
    });

    it('throws NotFoundException when the migration job does not belong to the tenant', async () => {
      prisma.migrationJob.findFirst.mockResolvedValue(null);

      await expect(
        service.commit('tenant-1', 'job-x', {
          fileToken: '123-456.xlsx',
          acceptedRowIndexes: [1],
        } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects a fileToken that does not match the safe generated pattern (path traversal defense)', async () => {
      await expect(
        service.commit('tenant-1', 'job-1', {
          fileToken: '../../etc/passwd',
          acceptedRowIndexes: [1],
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('never imports a row the server reclassifies as NAO_IMPORTAVEL, even if its index was accepted by the client', async () => {
      prisma.$transaction.mockResolvedValue([{ id: 'client-1' }]);

      // linha 1 = IMPORTAVEL, linha 2 = NAO_IMPORTAVEL (sem nome) - o client aceita as duas
      const result = await service.commit('tenant-1', 'job-1', {
        fileToken: '123-456.xlsx',
        acceptedRowIndexes: [1, 2],
      } as any);

      expect(result.importedCount).toBe(1);
      // $transaction foi chamado com um array de 1 create, não 2
      const transactionArg = prisma.$transaction.mock.calls[0][0];
      expect(transactionArg).toHaveLength(1);
    });

    it('throws BadRequestException when no accepted row is actually importable', async () => {
      await expect(
        service.commit('tenant-1', 'job-1', {
          fileToken: '123-456.xlsx',
          acceptedRowIndexes: [2], // só a linha NAO_IMPORTAVEL
        } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
