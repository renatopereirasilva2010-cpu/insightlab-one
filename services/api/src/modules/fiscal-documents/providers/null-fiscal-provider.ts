import { Injectable, Logger } from '@nestjs/common';
import { FiscalDocument } from '@prisma/client';
import { FiscalProvider, FiscalProviderOutcome } from './fiscal-provider.interface';

/**
 * Provider padrão enquanto nenhuma credencial real de emissão fiscal está
 * configurada. Nunca faz chamada externa - só sinaliza que a emissão foi
 * pulada, deixando o documento em DRAFT até a FASE 2 (Focus NFe real).
 */
@Injectable()
export class NullFiscalProvider implements FiscalProvider {
  private readonly logger = new Logger(NullFiscalProvider.name);

  async requestEmission(fiscalDocument: FiscalDocument): Promise<FiscalProviderOutcome> {
    this.logger.warn(
      `Nenhum provedor de emissão fiscal configurado - documento ${fiscalDocument.id} permanece em DRAFT.`,
    );

    return {
      type: 'skipped',
      reason: 'Nenhum provedor de emissão fiscal configurado ainda.',
    };
  }
}
