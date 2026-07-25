import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditLogService } from '../audit/audit-log.service';

const MUTATING_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditLogService: AuditLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    if (!MUTATING_METHODS.has(request.method)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap((responseBody) => {
        const user = request.user;
        if (!user?.tenantId) return; // sem tenant autenticado, nao ha o que auditar

        const entity = this.extractEntity(request.route?.path ?? request.url);
        const entityId = request.params?.id ?? responseBody?.id ?? 'unknown';

        void this.auditLogService.record({
          tenantId: user.tenantId,
          unitId: user.unitId ?? null,
          userId: user.sub ?? user.id ?? null,
          entity,
          entityId: String(entityId),
          action: `${request.method} ${request.route?.path ?? request.url}`,
          traceId: request.traceId ?? null,
        });
      }),
    );
  }

  private extractEntity(routePath: string): string {
    const segments = routePath.split('/').filter(Boolean);
    // ex.: v1/payments/:id/mark-failed -> "payments"
    return segments[1] ?? 'unknown';
  }
}
