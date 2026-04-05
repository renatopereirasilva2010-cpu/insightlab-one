import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    if (request.user?.tenantId) {
      request.tenant = { id: request.user.tenantId };
      return true;
    }
    return false;
  }
}
