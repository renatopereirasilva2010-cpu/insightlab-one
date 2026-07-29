import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { WhatsAppMessageStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { WHATSAPP_PROVIDER, WhatsAppProvider } from './providers/whatsapp-provider.interface';

const DEFAULT_APPOINTMENT_CONFIRMATION_TEMPLATE = 'agendamento_confirmado';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(WHATSAPP_PROVIDER) private readonly provider: WhatsAppProvider,
  ) {}

  findAllByTenant(tenantId: string) {
    return this.prisma.whatsAppMessage.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Dispara a confirmação de agendamento via WhatsApp. Nunca lança - qualquer
   * falha (sem telefone, provider indisponível, credencial ausente) fica
   * registrada no histórico e logada, sem travar o fluxo que criou o
   * agendamento.
   */
  async sendAppointmentConfirmation(
    tenantId: string,
    unitId: string | null,
    appointmentId: string,
  ): Promise<void> {
    try {
      const appointment = await this.prisma.appointment.findFirst({
        where: { id: appointmentId, tenantId },
        include: { client: true, service: true },
      });

      if (!appointment) {
        this.logger.warn(`Agendamento ${appointmentId} não encontrado para confirmação de WhatsApp.`);
        return;
      }

      const phone = this.normalizePhone(appointment.client.phone);
      if (!phone) {
        this.logger.warn(
          `Confirmação de WhatsApp pulada para o agendamento ${appointmentId}: cliente sem telefone.`,
        );
        return;
      }

      const templateName =
        process.env.WHATSAPP_TEMPLATE_APPOINTMENT_CONFIRMATION ||
        DEFAULT_APPOINTMENT_CONFIRMATION_TEMPLATE;

      await this.dispatch({
        tenantId,
        unitId,
        appointmentId: appointment.id,
        clientId: appointment.clientId,
        toPhone: phone,
        templateName,
        templateParams: [
          appointment.client.name,
          this.formatDateTimePtBR(appointment.startAt),
          appointment.service.name,
        ],
      });
    } catch (error) {
      this.logger.error(
        `Falha ao processar confirmação de WhatsApp para o agendamento ${appointmentId}`,
        error as Error,
      );
    }
  }

  async resend(tenantId: string, messageId: string) {
    const message = await this.prisma.whatsAppMessage.findFirst({
      where: { id: messageId, tenantId },
    });

    if (!message) {
      throw new NotFoundException({
        code: 'WHATSAPP_MESSAGE_NOT_FOUND',
        title: 'Mensagem não encontrada',
        message: 'Não encontramos a mensagem informada.',
        recommendedAction: 'Atualize a tela e tente novamente.',
      });
    }

    const outcome = await this.provider.sendTemplateMessage({
      toPhone: message.toPhone,
      templateName: message.templateName,
      templateParams: [],
    });

    return this.applyOutcome(message.id, outcome);
  }

  private async dispatch(input: {
    tenantId: string;
    unitId: string | null;
    appointmentId: string | null;
    clientId: string | null;
    toPhone: string;
    templateName: string;
    templateParams: string[];
  }) {
    const message = await this.prisma.whatsAppMessage.create({
      data: {
        tenantId: input.tenantId,
        unitId: input.unitId,
        appointmentId: input.appointmentId,
        clientId: input.clientId,
        toPhone: input.toPhone,
        templateName: input.templateName,
        status: WhatsAppMessageStatus.PENDING,
      },
    });

    const outcome = await this.provider.sendTemplateMessage({
      toPhone: input.toPhone,
      templateName: input.templateName,
      templateParams: input.templateParams,
    });

    return this.applyOutcome(message.id, outcome);
  }

  private applyOutcome(
    messageId: string,
    outcome:
      | { type: 'skipped'; reason: string }
      | { type: 'sent'; providerMessageId: string }
      | { type: 'failed'; errorCode: string; errorMessage: string },
  ) {
    if (outcome.type === 'skipped') {
      return this.prisma.whatsAppMessage.update({
        where: { id: messageId },
        data: { status: WhatsAppMessageStatus.SKIPPED, errorMessage: outcome.reason },
      });
    }

    if (outcome.type === 'sent') {
      return this.prisma.whatsAppMessage.update({
        where: { id: messageId },
        data: {
          status: WhatsAppMessageStatus.SENT,
          providerMessageId: outcome.providerMessageId,
          sentAt: new Date(),
          errorCode: null,
          errorMessage: null,
        },
      });
    }

    return this.prisma.whatsAppMessage.update({
      where: { id: messageId },
      data: {
        status: WhatsAppMessageStatus.FAILED,
        errorCode: outcome.errorCode,
        errorMessage: outcome.errorMessage,
      },
    });
  }

  /** Normaliza pra E.164 assumindo Brasil: só dígitos, prefixa 55 se faltar o código do país. */
  private normalizePhone(rawPhone: string | null): string | null {
    if (!rawPhone) return null;

    const digits = rawPhone.replace(/\D/g, '');
    if (!digits) return null;

    if (digits.startsWith('55') && digits.length >= 12) {
      return digits;
    }

    return `55${digits}`;
  }

  private formatDateTimePtBR(date: Date): string {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
      timeZone: 'America/Sao_Paulo',
    }).format(date);
  }
}
