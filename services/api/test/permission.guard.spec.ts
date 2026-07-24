import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionGuard } from '../src/common/guards/permission.guard';

describe('PermissionGuard', () => {
  function buildContext(user: { permissions?: string[] } | undefined) {
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  }

  function buildGuard(required: string[] | undefined) {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(required),
    } as unknown as Reflector;
    return new PermissionGuard(reflector);
  }

  it('allows access when the route requires no permissions', () => {
    const guard = buildGuard(undefined);
    const context = buildContext({ permissions: [] });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows access when the route requires an empty permission list', () => {
    const guard = buildGuard([]);
    const context = buildContext({ permissions: [] });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows access when the user has every required permission', () => {
    const guard = buildGuard(['payments.read', 'payments.update-status']);
    const context = buildContext({ permissions: ['payments.read', 'payments.update-status', 'sales.read'] });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('denies access (403) when the user is missing one required permission - the previously unvalidated restricted-user scenario', () => {
    const guard = buildGuard(['payments.read', 'payments.update-status']);
    const context = buildContext({ permissions: ['payments.read'] });

    expect(guard.canActivate(context)).toBe(false);
  });

  it('denies access when the user has none of the required permissions', () => {
    const guard = buildGuard(['payments.update-status']);
    const context = buildContext({ permissions: ['sales.read', 'clients.read'] });

    expect(guard.canActivate(context)).toBe(false);
  });

  it('denies access when the request has no user permissions at all', () => {
    const guard = buildGuard(['payments.read']);
    const context = buildContext(undefined);

    expect(guard.canActivate(context)).toBe(false);
  });
});
