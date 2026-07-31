import { existsSync, readFileSync } from 'fs';
import { basename, join } from 'path';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  analyzeClientSpreadsheet,
  ClientImportColumnMapping,
} from './client-import-parser';
import { AnalyzeClientImportDto } from './dto/analyze-client-import.dto';
import { CommitClientImportDto } from './dto/commit-client-import.dto';

/** Só nomes de arquivo gerados pelo próprio multer (timestamp-random.ext) - nunca aceita caminho vindo direto do cliente. */
const SAFE_FILE_TOKEN = /^[0-9]+-[0-9]+\.(csv|xls|xlsx)$/i;

@Injectable()
export class ClientImportService {
  constructor(private readonly prisma: PrismaService) {}

  private async requireJob(tenantId: string, jobId: string) {
    const job = await this.prisma.migrationJob.findFirst({ where: { id: jobId, tenantId } });
    if (!job) {
      throw new NotFoundException({
        code: 'MIGRATION_JOB_NOT_FOUND',
        title: 'Job de migração não encontrado',
        message: 'Não encontramos o job de migração informado.',
        recommendedAction: 'Crie um novo job de importação e tente de novo.',
      });
    }
    return job;
  }

  private resolveFilePath(tenantId: string, fileToken: string): string {
    const safeToken = basename(fileToken);
    if (!SAFE_FILE_TOKEN.test(safeToken)) {
      throw new BadRequestException({
        code: 'INVALID_FILE_TOKEN',
        title: 'Arquivo inválido',
        message: 'A referência do arquivo enviado não é válida.',
        recommendedAction: 'Envie o arquivo novamente.',
      });
    }
    const filePath = join(process.cwd(), 'uploads', 'migrations', tenantId, safeToken);
    if (!existsSync(filePath)) {
      throw new NotFoundException({
        code: 'IMPORT_FILE_NOT_FOUND',
        title: 'Arquivo não encontrado',
        message: 'O arquivo enviado para análise não está mais disponível.',
        recommendedAction: 'Envie o arquivo novamente.',
      });
    }
    return filePath;
  }

  private async existingPhones(tenantId: string): Promise<Set<string>> {
    const clients = await this.prisma.client.findMany({
      where: { tenantId, phone: { not: null } },
      select: { phone: true },
    });
    return new Set(clients.map((c) => (c.phone ?? '').replace(/\D/g, '')).filter(Boolean));
  }

  async analyze(tenantId: string, jobId: string, file: Express.Multer.File, dto: AnalyzeClientImportDto) {
    await this.requireJob(tenantId, jobId);

    const buffer = readFileSync(file.path);
    const existingPhones = await this.existingPhones(tenantId);
    const override: Partial<ClientImportColumnMapping> = {
      ...(dto.nameColumn ? { name: dto.nameColumn } : {}),
      ...(dto.phoneColumn ? { phone: dto.phoneColumn } : {}),
      ...(dto.emailColumn ? { email: dto.emailColumn } : {}),
      ...(dto.sourceColumn ? { source: dto.sourceColumn } : {}),
    };

    const analysis = analyzeClientSpreadsheet(buffer, existingPhones, override);

    return {
      fileToken: basename(file.path),
      ...analysis,
      summary: {
        importavel: analysis.rows.filter((r) => r.status === 'IMPORTAVEL').length,
        parcial: analysis.rows.filter((r) => r.status === 'PARCIAL').length,
        duplicado: analysis.rows.filter((r) => r.status === 'DUPLICADO').length,
        naoImportavel: analysis.rows.filter((r) => r.status === 'NAO_IMPORTAVEL').length,
      },
    };
  }

  async commit(tenantId: string, jobId: string, dto: CommitClientImportDto) {
    const job = await this.requireJob(tenantId, jobId);
    const filePath = this.resolveFilePath(tenantId, dto.fileToken);
    const buffer = readFileSync(filePath);

    const existingPhones = await this.existingPhones(tenantId);
    const override: Partial<ClientImportColumnMapping> = {
      ...(dto.nameColumn ? { name: dto.nameColumn } : {}),
      ...(dto.phoneColumn ? { phone: dto.phoneColumn } : {}),
      ...(dto.emailColumn ? { email: dto.emailColumn } : {}),
      ...(dto.sourceColumn ? { source: dto.sourceColumn } : {}),
    };
    const analysis = analyzeClientSpreadsheet(buffer, existingPhones, override);

    // Nunca confia cegamente nos índices vindos do frontend - só linhas que a
    // própria análise (recalculada agora, no servidor) classificou como
    // importáveis podem virar Client, mesmo que o índice tenha sido aceito.
    const acceptedSet = new Set(dto.acceptedRowIndexes);
    const rowsToImport = analysis.rows.filter(
      (r) => acceptedSet.has(r.rowIndex) && (r.status === 'IMPORTAVEL' || r.status === 'PARCIAL'),
    );

    if (rowsToImport.length === 0) {
      throw new BadRequestException({
        code: 'NO_ROWS_TO_IMPORT',
        title: 'Nada para importar',
        message: 'Nenhuma das linhas selecionadas é importável.',
        recommendedAction: 'Revise a seleção na tela de análise.',
      });
    }

    const created = await this.prisma.$transaction(
      rowsToImport.map((row) =>
        this.prisma.client.create({
          data: {
            tenantId,
            name: row.name as string,
            phone: row.phone,
            email: row.email,
            source: 'IMPORT_CSV',
          },
        }),
      ),
    );

    const batchCode = `import-${Date.now()}`;
    await this.prisma.migrationBatch.create({
      data: {
        migrationJobId: job.id,
        batchCode,
        status: 'IMPORTED',
        importedCount: created.length,
        notes: `Importação de clientes via ${dto.fileToken}`,
      },
    });
    await this.prisma.migrationJob.update({
      where: { id: job.id },
      data: { status: 'IMPORTED', importedRecords: { increment: created.length } },
    });

    return {
      importedCount: created.length,
      skippedCount: analysis.rows.length - created.length,
      clients: created,
    };
  }
}
