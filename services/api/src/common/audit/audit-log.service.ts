import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { QueryAuditLogDto } from './dto/query-audit-log.dto';

export interface AuditLogEntry {
  tenantId: string;
  unitId?: string | null;
  userId?: string | null;
  entity: string;
  entityId: string;
  action: string;
  traceId?: string | null;
  metadataJson?: Record<string, unknown>;
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(entry: AuditLogEntry) {
    try {
      await this.prisma.auditLog.create({
        data: {
          tenantId: entry.tenantId,
          unitId: entry.unitId ?? null,
          userId: entry.userId ?? null,
          entity: entry.entity,
          entityId: entry.entityId,
          action: entry.action,
          traceId: entry.traceId ?? null,
          metadataJson: entry.metadataJson as Prisma.InputJsonValue | undefined,
        },
      });
    } catch (error) {
      // auditoria nunca pode derrubar a requisicao original - so registra e segue
      this.logger.warn(`Falha ao gravar audit log: ${(error as Error).message}`);
    }
  }

  async query(tenantId: string, query: QueryAuditLogDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 50;

    const where: Prisma.AuditLogWhereInput = {
      tenantId,
      ...(query.entity ? { entity: query.entity } : {}),
      ...(query.from || query.to
        ? {
            createdAt: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { user: { select: { name: true, email: true } } },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }
}
