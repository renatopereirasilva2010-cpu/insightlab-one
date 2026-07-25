import { of } from 'rxjs';
import { AuditInterceptor } from '../src/common/interceptors/audit.interceptor';

describe('AuditInterceptor', () => {
  function buildContext(request: any) {
    return {
      switchToHttp: () => ({ getRequest: () => request }),
    } as any;
  }

  function buildAuditService() {
    return { record: jest.fn().mockResolvedValue(undefined) };
  }

  it('does not audit GET requests', (done) => {
    const auditService = buildAuditService();
    const interceptor = new AuditInterceptor(auditService as any);
    const request = { method: 'GET', route: { path: '/v1/payments' }, user: { tenantId: 't-1' } };
    const next = { handle: () => of({ id: 'pay-1' }) };

    interceptor.intercept(buildContext(request), next as any).subscribe(() => {
      expect(auditService.record).not.toHaveBeenCalled();
      done();
    });
  });

  it('does not audit when there is no authenticated tenant', (done) => {
    const auditService = buildAuditService();
    const interceptor = new AuditInterceptor(auditService as any);
    const request = { method: 'POST', route: { path: '/v1/auth/login' }, user: undefined };
    const next = { handle: () => of({ accessToken: 'x' }) };

    interceptor.intercept(buildContext(request), next as any).subscribe(() => {
      expect(auditService.record).not.toHaveBeenCalled();
      done();
    });
  });

  it('records a mutating request with entity/entityId derived from route and response', (done) => {
    const auditService = buildAuditService();
    const interceptor = new AuditInterceptor(auditService as any);
    const request = {
      method: 'POST',
      route: { path: '/v1/payments' },
      params: {},
      traceId: 'trace-1',
      user: { tenantId: 't-1', unitId: 'u-1', id: 'user-1' },
    };
    const next = { handle: () => of({ id: 'pay-new' }) };

    interceptor.intercept(buildContext(request), next as any).subscribe(() => {
      expect(auditService.record).toHaveBeenCalledWith({
        tenantId: 't-1',
        unitId: 'u-1',
        userId: 'user-1',
        entity: 'payments',
        entityId: 'pay-new',
        action: 'POST /v1/payments',
        traceId: 'trace-1',
      });
      done();
    });
  });

  it('prefers the route :id param over the response body id', (done) => {
    const auditService = buildAuditService();
    const interceptor = new AuditInterceptor(auditService as any);
    const request = {
      method: 'POST',
      route: { path: '/v1/payments/:id/mark-failed' },
      params: { id: 'pay-1' },
      user: { tenantId: 't-1', id: 'user-1' },
    };
    const next = { handle: () => of({ id: 'pay-1', status: 'FAILED' }) };

    interceptor.intercept(buildContext(request), next as any).subscribe(() => {
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({ entityId: 'pay-1', entity: 'payments' }),
      );
      done();
    });
  });
});
