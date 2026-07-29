import { Injectable, Logger } from '@nestjs/common';
import {
  WhatsAppProvider,
  WhatsAppProviderOutcome,
  WhatsAppTemplateMessage,
} from './whatsapp-provider.interface';

/**
 * Provider padrão enquanto nenhuma credencial real do Meta Cloud API está
 * configurada (WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID). Nunca faz
 * chamada externa - só sinaliza que o envio foi pulado, sem travar o fluxo
 * que disparou a mensagem (ex.: criação de agendamento).
 */
@Injectable()
export class NullWhatsAppProvider implements WhatsAppProvider {
  private readonly logger = new Logger(NullWhatsAppProvider.name);

  async sendTemplateMessage(message: WhatsAppTemplateMessage): Promise<WhatsAppProviderOutcome> {
    this.logger.warn(
      `Nenhuma credencial do WhatsApp configurada - mensagem "${message.templateName}" para ${message.toPhone} não foi enviada.`,
    );

    return {
      type: 'skipped',
      reason: 'Nenhuma credencial do WhatsApp (Meta Cloud API) configurada ainda.',
    };
  }
}
