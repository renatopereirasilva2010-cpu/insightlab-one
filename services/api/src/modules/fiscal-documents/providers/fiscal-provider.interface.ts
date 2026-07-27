import { FiscalDocument } from '@prisma/client';

export type FiscalProviderOutcome =
  | { type: 'skipped'; reason: string }
  | { type: 'requested'; referenceNumber?: string; accessKey?: string }
  | { type: 'failed'; errorCode: string; errorMessage: string };

export interface FiscalProvider {
  requestEmission(fiscalDocument: FiscalDocument): Promise<FiscalProviderOutcome>;
}

export const FISCAL_PROVIDER = Symbol('FISCAL_PROVIDER');
