import { Injectable, Logger } from '@nestjs/common';
import {
  WhatsAppProvider,
  WhatsAppProviderOutcome,
  WhatsAppTemplateMessage,
} from './whatsapp-provider.interface';

/**
 * Integração real com o Meta Cloud API (WhatsApp Business Platform).
 * Racional da escolha: governance/insightlab-one-onda5-backlog-consolidado.md,
 * seção 5 - acesso técnico gratuito, sem BSP pago, custo restrito ao que a
 * própria Meta cobra por conversa iniciada.
 *
 * Em modo sandbox: usa o número de teste e o token temporário gerados no
 * Meta for Developers (App > WhatsApp > API Setup), com até 5 destinatários
 * verificados. O template em WHATSAPP_TEMPLATE_APPOINTMENT_CONFIRMATION
 * precisa existir e estar aprovado no Meta Business Manager antes do envio -
 * isso é configuração de conta, feita por fora deste código.
 */
@Injectable()
export class MetaCloudApiWhatsAppProvider implements WhatsAppProvider {
  private readonly logger = new Logger(MetaCloudApiWhatsAppProvider.name);

  private get phoneNumberId(): string | undefined {
    return process.env.WHATSAPP_PHONE_NUMBER_ID;
  }

  private get accessToken(): string | undefined {
    return process.env.WHATSAPP_ACCESS_TOKEN;
  }

  private get apiVersion(): string {
    return process.env.WHATSAPP_API_VERSION || 'v21.0';
  }

  async sendTemplateMessage(message: WhatsAppTemplateMessage): Promise<WhatsAppProviderOutcome> {
    if (!this.phoneNumberId || !this.accessToken) {
      return {
        type: 'skipped',
        reason: 'Credenciais do Meta Cloud API ausentes no momento do envio.',
      };
    }

    try {
      const response = await fetch(
        `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: message.toPhone,
            type: 'template',
            template: {
              name: message.templateName,
              language: { code: 'pt_BR' },
              ...(message.templateParams.length
                ? {
                    components: [
                      {
                        type: 'body',
                        parameters: message.templateParams.map((text) => ({ type: 'text', text })),
                      },
                    ],
                  }
                : {}),
            },
          }),
        },
      );

      const body: any = await response.json().catch(() => null);

      if (!response.ok) {
        const errorCode = body?.error?.code ? String(body.error.code) : String(response.status);
        const errorMessage = body?.error?.message ?? 'Falha ao enviar mensagem via WhatsApp.';
        this.logger.warn(`Envio de WhatsApp falhou (${errorCode}): ${errorMessage}`);
        return { type: 'failed', errorCode, errorMessage };
      }

      const providerMessageId = body?.messages?.[0]?.id ?? '';
      return { type: 'sent', providerMessageId };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido.';
      this.logger.error(`Erro de rede ao chamar o Meta Cloud API: ${errorMessage}`);
      return { type: 'failed', errorCode: 'NETWORK_ERROR', errorMessage };
    }
  }
}
