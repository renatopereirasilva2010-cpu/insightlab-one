import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestContextStore {
  traceId: string;
  tenantId?: string;
}

export const requestContext = new AsyncLocalStorage<RequestContextStore>();

export function getRequestContext(): RequestContextStore | undefined {
  return requestContext.getStore();
}

export function setTenantId(tenantId: string): void {
  const store = requestContext.getStore();
  if (store) store.tenantId = tenantId;
}
