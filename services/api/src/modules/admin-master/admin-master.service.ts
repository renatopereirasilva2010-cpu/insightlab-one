import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateMigrationJobDto } from './dto/create-migration-job.dto';
import { ImportMigrationBatchDto } from './dto/import-migration-batch.dto';
import { ReconcileMigrationJobDto } from './dto/reconcile-migration-job.dto';

@Injectable()
export class AdminMasterService {
  constructor(private readonly prisma: PrismaService) {}

  findMigrationJobsByTenant(tenantId: string) {
    return this.prisma.migrationJob.findMany({
      where: { tenantId },
      include: { batches: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  createMigrationJob(tenantId: string, dto: CreateMigrationJobDto) {
    return this.prisma.migrationJob.create({
      data: {
        tenantId,
        sourceType: dto.sourceType as any,
        sourceReference: dto.sourceReference,
        notes: dto.notes,
      },
    });
  }

  async importBatch(tenantId: string, jobId: string, dto: ImportMigrationBatchDto) {
    const job = await this.prisma.migrationJob.findFirst({
      where: { id: jobId, tenantId },
    });

    if (!job) {
      throw new NotFoundException({
        code: 'MIGRATION_JOB_NOT_FOUND',
        title: 'Job de migração não encontrado',
        message: 'Não encontramos o job de migração informado.',
        recommendedAction: 'Atualize a tela e tente novamente.',
      });
    }

    const existingBatch = await this.prisma.migrationBatch.findFirst({
      where: { migrationJobId: job.id, batchCode: dto.batchCode },
    });

    if (existingBatch) {
      throw new BadRequestException({
        code: 'MIGRATION_BATCH_ALREADY_EXISTS',
        title: 'Lote já importado',
        message: 'Já existe um lote com este código para o job informado.',
        recommendedAction: 'Revise o código do lote antes de continuar.',
      });
    }

    await this.prisma.migrationJob.update({
      where: { id: job.id },
      data: {
        status: 'IMPORTING',
      },
    });

    const batch = await this.prisma.migrationBatch.create({
      data: {
        migrationJobId: job.id,
        batchCode: dto.batchCode,
        status: 'IMPORTED',
        importedCount: dto.importedCount,
        notes: dto.notes,
      },
    });

    await this.prisma.migrationJob.update({
      where: { id: job.id },
      data: {
        status: 'IMPORTED',
        importedRecords: { increment: dto.importedCount },
      },
    });

    return batch;
  }

  async reconcileJob(tenantId: string, jobId: string, dto: ReconcileMigrationJobDto) {
    const job = await this.prisma.migrationJob.findFirst({
      where: { id: jobId, tenantId },
      include: { batches: true },
    });

    if (!job) {
      throw new NotFoundException({
        code: 'MIGRATION_JOB_NOT_FOUND',
        title: 'Job de migração não encontrado',
        message: 'Não encontramos o job de migração informado.',
        recommendedAction: 'Atualize a tela e tente novamente.',
      });
    }

    if (job.importedRecords < dto.reconciledRecords) {
      throw new BadRequestException({
        code: 'MIGRATION_RECONCILIATION_INVALID',
        title: 'Reconciliação inválida',
        message: 'Os registros reconciliados não podem exceder os registros importados.',
        recommendedAction: 'Revise os números informados e tente novamente.',
      });
    }

    return this.prisma.migrationJob.update({
      where: { id: job.id },
      data: {
        status: 'RECONCILED',
        reconciledRecords: dto.reconciledRecords,
        notes: dto.notes ? `${job.notes ?? ''}\n[RECONCILIAÇÃO] ${dto.notes}`.trim() : job.notes,
      },
      include: { batches: true },
    });
  }
}
