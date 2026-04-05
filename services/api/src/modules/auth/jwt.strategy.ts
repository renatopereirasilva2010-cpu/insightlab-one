import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET || 'change-me',
    });
  }

  async validate(payload: { sub: string; tenantId: string; email: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException({
        code: 'AUTH_INVALID_SESSION',
        title: 'Sessão inválida',
        message: 'Sua sessão não é mais válida.',
        recommendedAction: 'Faça login novamente.',
      });
    }

    const permissions = Array.from(
      new Set(
        user.userRoles.flatMap((userRole) =>
          userRole.role.rolePermissions.map((rp) => rp.permission.code),
        ),
      ),
    );

    return {
      id: user.id,
      email: user.email,
      tenantId: user.tenantId,
      unitId: user.unitId,
      permissions,
    };
  }
}
