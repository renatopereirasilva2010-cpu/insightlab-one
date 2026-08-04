import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { buildPhotoUrl } from '../../common/upload/photo-upload.interceptor';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Mesmo padrão de dedup por telefone já usado no import (client-import.service.ts) - aqui aplicado também no cadastro manual, avisando em vez de criar duplicata silenciosa. */
  private async findPhoneConflict(tenantId: string, phone: string | undefined) {
    if (!phone) return null;
    const digits = onlyDigits(phone);
    if (digits.length < 8) return null;

    const candidates = await this.prisma.client.findMany({
      where: { tenantId, phone: { not: null } },
      select: { id: true, name: true, phone: true, status: true },
    });
    return candidates.find((c) => onlyDigits(c.phone ?? '') === digits) ?? null;
  }

  /**
   * Sem page/pageSize: retorna a lista completa, sem paginar - varias telas
   * (seletor de cliente em agendamento/venda/atendimento, lookups por id,
   * relatorio de clientes inativos) dependem do array cheio e nao devem
   * quebrar. Paginacao e opt-in, usada hoje só pela tela de listagem
   * /clientes (que pode ter milhares de linhas apos import real - onda12).
   */
  async findAllByTenant(tenantId: string, query?: { page?: number; pageSize?: number }) {
    const where = { tenantId };

    if (!query?.page && !query?.pageSize) {
      return this.prisma.client.findMany({ where, orderBy: { createdAt: 'desc' } });
    }

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 50;

    const [items, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.client.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async create(tenantId: string, unitId: string | null, dto: CreateClientDto) {
    const conflict = await this.findPhoneConflict(tenantId, dto.phone);
    if (conflict) {
      throw new ConflictException({
        code: 'CLIENT_PHONE_CONFLICT',
        title: 'Já existe um cliente com este telefone',
        message: `"${conflict.name}" já está cadastrado com este telefone (status: ${conflict.status}).`,
        recommendedAction:
          conflict.status === 'ACTIVE'
            ? 'Se for a mesma pessoa, edite o cadastro existente em vez de criar um novo. Se for uma pessoa diferente, confira o telefone informado.'
            : 'Esse cadastro está inativo/excluído - se for a mesma pessoa, reative-o em vez de criar um novo. Se for uma pessoa diferente, confira o telefone informado.',
        details: { existingClientId: conflict.id },
      });
    }

    return this.prisma.client.create({
      data: {
        tenantId,
        unitId,
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        socialName: dto.socialName,
        source: dto.source,
      },
    });
  }

  async update(tenantId: string, clientId: string, dto: UpdateClientDto) {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, tenantId },
    });

    if (!client) {
      throw new NotFoundException({
        code: 'CLIENT_NOT_FOUND',
        title: 'Cliente não encontrado',
        message: 'Não encontramos o cliente informado para este tenant.',
        recommendedAction: 'Revise o cliente selecionado e tente novamente.',
      });
    }

    return this.prisma.client.update({
      where: { id: client.id },
      data: {
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        socialName: dto.socialName,
        source: dto.source,
        status: dto.status,
      },
    });
  }

  private async requireClient(tenantId: string, clientId: string) {
    const client = await this.prisma.client.findFirst({ where: { id: clientId, tenantId } });
    if (!client) {
      throw new NotFoundException({
        code: 'CLIENT_NOT_FOUND',
        title: 'Cliente não encontrado',
        message: 'Não encontramos o cliente informado para este tenant.',
        recommendedAction: 'Revise o cliente selecionado e tente novamente.',
      });
    }
    return client;
  }

  /**
   * Conta o histórico vinculado ao cliente pra decidir se dá pra excluir de
   * verdade ou só desativar. Payment/Commission/FiscalDocument não têm FK
   * direta pra Client (só via Sale.saleId) - por isso contamos através das
   * vendas do cliente, mas o critério de "tem histórico" já fica coberto
   * só com `sales > 0` (schema.prisma: Sale/Payment/Commission/
   * FiscalDocument formam uma cadeia, não existe Payment/Commission sem
   * Sale). Os números aqui são só pra mostrar o racional completo pro
   * admin antes de decidir - não pra recalcular a regra de segurança.
   */
  async getDeleteImpact(tenantId: string, clientId: string) {
    const client = await this.requireClient(tenantId, clientId);

    const [appointments, attendances, whatsAppMessages, sales] = await Promise.all([
      this.prisma.appointment.count({ where: { clientId } }),
      this.prisma.attendance.count({ where: { clientId } }),
      this.prisma.whatsAppMessage.count({ where: { clientId } }),
      this.prisma.sale.findMany({ where: { clientId }, select: { id: true } }),
    ]);

    const saleIds = sales.map((s) => s.id);
    const [payments, commissions, fiscalDocuments] = saleIds.length
      ? await Promise.all([
          this.prisma.payment.count({ where: { saleId: { in: saleIds } } }),
          this.prisma.commission.count({ where: { saleId: { in: saleIds } } }),
          this.prisma.fiscalDocument.count({
            where: { sourceType: 'SALE', sourceId: { in: saleIds } },
          }),
        ])
      : [0, 0, 0];

    const hasHistory =
      appointments > 0 || attendances > 0 || whatsAppMessages > 0 || saleIds.length > 0;

    return {
      client: { id: client.id, name: client.name, status: client.status },
      counts: {
        appointments,
        attendances,
        whatsAppMessages,
        sales: saleIds.length,
        payments,
        commissions,
        fiscalDocuments,
      },
      canHardDelete: !hasHistory,
    };
  }

  /**
   * Nunca confia no que o frontend calculou - reavalia o impacto aqui
   * mesmo, igual ao padrão já usado no commit de import (client-import.
   * service.ts): a decisão de excluir de verdade vs. só desativar é
   * sempre tomada de novo no servidor.
   */
  async remove(tenantId: string, clientId: string, actingUserId: string) {
    const impact = await this.getDeleteImpact(tenantId, clientId);

    if (impact.canHardDelete) {
      await this.prisma.client.delete({ where: { id: clientId } });
      return { mode: 'DELETED' as const, impact: impact.counts };
    }

    const actingUser = await this.prisma.user.findUnique({
      where: { id: actingUserId },
      select: { name: true, email: true },
    });
    const who = actingUser?.name ?? actingUser?.email ?? 'admin';
    const when = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const stamp = `[Cliente excluído em ${when} por ${who} - desativado em vez de apagado porque tem histórico de venda/agendamento/comissão vinculado; reative mudando o status para Ativo se necessário.]`;

    const client = await this.requireClient(tenantId, clientId);
    const updated = await this.prisma.client.update({
      where: { id: clientId },
      data: {
        status: 'INACTIVE',
        notes: client.notes ? `${stamp}\n${client.notes}` : stamp,
      },
    });

    return { mode: 'DEACTIVATED' as const, impact: impact.counts, client: updated };
  }

  async updatePhoto(tenantId: string, clientId: string, file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException({
        code: 'PHOTO_REQUIRED',
        title: 'Foto obrigatória',
        message: 'Envie uma imagem PNG, JPEG ou WEBP de até 3MB.',
        recommendedAction: 'Selecione um arquivo válido e tente novamente.',
      });
    }

    const client = await this.prisma.client.findFirst({
      where: { id: clientId, tenantId },
    });

    if (!client) {
      throw new NotFoundException({
        code: 'CLIENT_NOT_FOUND',
        title: 'Cliente não encontrado',
        message: 'Não encontramos o cliente informado para este tenant.',
        recommendedAction: 'Revise o cliente selecionado e tente novamente.',
      });
    }

    return this.prisma.client.update({
      where: { id: client.id },
      data: { photoUrl: buildPhotoUrl('clients', tenantId, file.filename) },
    });
  }
}
