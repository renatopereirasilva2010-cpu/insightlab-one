import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
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

    if (!user) {
      throw new UnauthorizedException({
        code: 'AUTH_INVALID_CREDENTIALS',
        title: 'Credenciais inválidas',
        message: 'E-mail ou senha inválidos.',
        recommendedAction: 'Revise as credenciais e tente novamente.',
      });
    }

    const passwordOk = await bcrypt.compare(password, user.passwordHash);
    if (!passwordOk) {
      throw new UnauthorizedException({
        code: 'AUTH_INVALID_CREDENTIALS',
        title: 'Credenciais inválidas',
        message: 'E-mail ou senha inválidos.',
        recommendedAction: 'Revise as credenciais e tente novamente.',
      });
    }

    const permissions = Array.from(
      new Set(
        user.userRoles.flatMap((userRole) =>
          userRole.role.rolePermissions.map((rp) => rp.permission.code),
        ),
      ),
    );

    const payload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload, {
        secret: process.env.JWT_ACCESS_SECRET || 'change-me',
        expiresIn: process.env.JWT_ACCESS_TTL || '15m',
      }),
      refreshToken: await this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET || 'change-me-too',
        expiresIn: process.env.JWT_REFRESH_TTL || '7d',
      }),
      user: {
        id: user.id,
        email: user.email,
        tenantId: user.tenantId,
        unitId: user.unitId,
        permissions,
      },
    };
  }
}
