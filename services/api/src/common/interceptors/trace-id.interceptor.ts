import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Observable } from 'rxjs';
import { getRequestContext, setTenantId } from '../logging/request-context';

@Injectable()
export class TraceIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    // traceId ja vem setado pelo RequestContextMiddleware (roda antes de guards/interceptors);
    // o fallback aqui soh cobre chamadas que nao passam pelo middleware (ex.: testes isolados).
    request.traceId = getRequestContext()?.traceId ?? request.headers['x-trace-id'] ?? randomUUID();

    const tenantId = request.user?.tenantId;
    if (tenantId) setTenantId(tenantId);

    return next.handle();
  }
}
