import { ConsoleLogger, LogLevel } from '@nestjs/common';
import { getRequestContext } from './request-context';

const ESC = String.fromCharCode(27);
// eslint-disable-next-line no-control-regex
const ANSI_PATTERN = new RegExp(ESC + '\\[[0-9;]*m', 'g');

/**
 * Logger em JSON, uma linha por evento, com traceId/tenantId correlacionados
 * via AsyncLocalStorage (secao 8 do adendo de governanca - logs estruturados
 * com correlacao por tenant/request, mesmo antes da stack de observability
 * completa do R1.11).
 */
export class StructuredLogger extends ConsoleLogger {
  protected formatMessage(
    logLevel: LogLevel,
    message: unknown,
    pidMessage: string,
    formattedLogLevel: string,
    contextMessage: string,
    timestampDiff: string,
  ): string {
    const ctx = getRequestContext();
    const plainContext = contextMessage?.replace(ANSI_PATTERN, '').trim();

    const entry = {
      timestamp: new Date().toISOString(),
      level: logLevel,
      message: typeof message === 'string' ? message : JSON.stringify(message),
      context: plainContext?.replace(/^\[|\]$/g, '') || undefined,
      traceId: ctx?.traceId,
      tenantId: ctx?.tenantId,
    };

    return JSON.stringify(entry) + '\n';
  }
}
