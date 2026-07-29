import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRED_PERMISSIONS_KEY } from '../decorators/required-permissions.decorator';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(REQUIRED_PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const permissions: string[] = user?.permissions ?? [];

    const allowed = required.every((permission) => permissions.includes(permission));
    if (!allowed) {
      throw new ForbiddenException({
        code: 'PERMISSION_DENIED',
        title: 'Sem permissão',
        message: 'Sua conta não tem permissão para acessar este recurso.',
        recommendedAction: 'Se você acredita que deveria ter acesso, contate um administrador.',
      });
    }

    return true;
  }
}
