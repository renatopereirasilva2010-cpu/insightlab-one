export interface WhatsAppTemplateMessage {
  toPhone: string;
  templateName: string;
  templateParams: string[];
}

export type WhatsAppProviderOutcome =
  | { type: 'skipped'; reason: string }
  | { type: 'sent'; providerMessageId: string }
  | { type: 'failed'; errorCode: string; errorMessage: string };

export interface WhatsAppProvider {
  sendTemplateMessage(message: WhatsAppTemplateMessage): Promise<WhatsAppProviderOutcome>;
}

export const WHATSAPP_PROVIDER = Symbol('WHATSAPP_PROVIDER');
