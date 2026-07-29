import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConsentSubjectType, LegalDocumentType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateDataSubjectRequestDto } from './dto/create-data-subject-request.dto';
import { UpdateDataSubjectRequestDto } from './dto/update-data-subject-request.dto';

@Injectable()
export class LegalService {
  constructor(private readonly prisma: PrismaService) {}

  async getCurrentDocument(type: LegalDocumentType) {
    const document = await this.prisma.legalDocument.findFirst({
      where: { type, active: true },
      orderBy: { publishedAt: 'desc' },
    });

    if (!document) {
      throw new NotFoundException({
        code: 'LEGAL_DOCUMENT_NOT_FOUND',
        title: 'Documento não encontrado',
        message: 'Nenhum documento legal ativo foi publicado para este tipo ainda.',
        recommendedAction: 'Contate o suporte do InsightLab.',
      });
    }

    return document;
  }

  async getOwnConsentStatus(userId: string) {
    const [terms, privacy] = await Promise.all([
      this.prisma.legalDocument.findFirst({
        where: { type: LegalDocumentType.TERMS_OF_USE, active: true },
        orderBy: { publishedAt: 'desc' },
      }),
      this.prisma.legalDocument.findFirst({
        where: { type: LegalDocumentType.PRIVACY_POLICY, active: true },
        orderBy: { publishedAt: 'desc' },
      }),
    ]);

    const [termsAccepted, privacyAccepted] = await Promise.all([
      terms ? this.hasAcceptedDocument(userId, terms.id) : Promise.resolve(true),
      privacy ? this.hasAcceptedDocument(userId, privacy.id) : Promise.resolve(true),
    ]);

    return {
      termsOfUse: terms ? { id: terms.id, version: terms.version, accepted: termsAccepted } : null,
      privacyPolicy: privacy
        ? { id: privacy.id, version: privacy.version, accepted: privacyAccepted }
        : null,
    };
  }

  async acceptConsent(
    tenantId: string,
    userId: string,
    type: LegalDocumentType,
    ipAddress: string | null,
    userAgent: string | null,
  ) {
    const document = await this.getCurrentDocument(type);

    const alreadyAccepted = await this.hasAcceptedDocument(userId, document.id);
    if (alreadyAccepted) {
      return { accepted: true, alreadyAccepted: true };
    }

    await this.prisma.consentRecord.create({
      data: {
        tenantId,
        subjectType: ConsentSubjectType.USER,
        subjectId: userId,
        legalDocumentId: document.id,
        ipAddress,
        userAgent,
      },
    });

    return { accepted: true, alreadyAccepted: false };
  }

  /** Registra o aceite de um titular externo (ex.: cliente no agendamento público). Nunca lança. */
  async recordClientConsent(
    tenantId: string,
    clientId: string,
    type: LegalDocumentType,
    ipAddress: string | null,
    userAgent: string | null,
  ): Promise<void> {
    try {
      const document = await this.prisma.legalDocument.findFirst({
        where: { type, active: true },
        orderBy: { publishedAt: 'desc' },
      });

      if (!document) return;

      await this.prisma.consentRecord.create({
        data: {
          tenantId,
          subjectType: ConsentSubjectType.CLIENT,
          subjectId: clientId,
          legalDocumentId: document.id,
          ipAddress,
          userAgent,
        },
      });
    } catch {
      // registro de consentimento nunca deve travar o fluxo que o originou
    }
  }

  private async hasAcceptedDocument(subjectId: string, legalDocumentId: string): Promise<boolean> {
    const record = await this.prisma.consentRecord.findFirst({
      where: {
        subjectType: ConsentSubjectType.USER,
        subjectId,
        legalDocumentId,
        revokedAt: null,
      },
    });

    return Boolean(record);
  }

  async createDataSubjectRequest(tenantSlug: string, dto: CreateDataSubjectRequestDto) {
    const tenant = await this.resolveTenant(tenantSlug);

    return this.prisma.dataSubjectRequest.create({
      data: {
        tenantId: tenant.id,
        subjectType: ConsentSubjectType.CLIENT,
        requesterName: dto.requesterName,
        requesterContact: dto.requesterContact,
        requestType: dto.requestType,
        description: dto.description,
      },
    });
  }

  findDataSubjectRequests(tenantId: string) {
    return this.prisma.dataSubjectRequest.findMany({
      where: { tenantId },
      orderBy: { requestedAt: 'desc' },
    });
  }

  async updateDataSubjectRequest(
    tenantId: string,
    id: string,
    dto: UpdateDataSubjectRequestDto,
  ) {
    const request = await this.prisma.dataSubjectRequest.findFirst({
      where: { id, tenantId },
    });

    if (!request) {
      throw new NotFoundException({
        code: 'DATA_SUBJECT_REQUEST_NOT_FOUND',
        title: 'Solicitação não encontrada',
        message: 'Não encontramos a solicitação informada.',
        recommendedAction: 'Atualize a tela e tente novamente.',
      });
    }

    return this.prisma.dataSubjectRequest.update({
      where: { id: request.id },
      data: {
        status: dto.status,
        resolutionNotes: dto.resolutionNotes,
        resolvedAt: ['RESOLVED', 'REJECTED'].includes(dto.status) ? new Date() : request.resolvedAt,
      },
    });
  }

  private async resolveTenant(tenantSlug: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug: tenantSlug } });

    if (!tenant || tenant.status !== 'ACTIVE') {
      throw new BadRequestException({
        code: 'LEGAL_TENANT_NOT_FOUND',
        title: 'Página não encontrada',
        message: 'Não encontramos essa página.',
        recommendedAction: 'Confira o link e tente novamente.',
      });
    }

    return tenant;
  }
}
