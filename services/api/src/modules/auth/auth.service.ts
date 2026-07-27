import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../database/prisma.service';
import { setTenantId } from '../../common/logging/request-context';

type UserWithRoles = {
  id: string;
  email: string;
  tenantId: string;
  unitId: string | null;
  professionalId: string | null;
  status: string;
  userRoles: {
    role: { rolePermissions: { permission: { code: string } }[] };
  }[];
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  private readonly userInclude = {
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
  } as const;

  private async issueTokens(user: UserWithRoles) {
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
        professionalId: user.professionalId,
        permissions,
      },
    };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: this.userInclude,
    });

    if (!user) {
      this.logger.warn(`Login negado: usuário não encontrado para ${email}`);
      throw new UnauthorizedException({
        code: 'AUTH_INVALID_CREDENTIALS',
        title: 'Credenciais inválidas',
        message: 'E-mail ou senha inválidos.',
        recommendedAction: 'Revise as credenciais e tente novamente.',
      });
    }

    // A partir daqui ja sabemos o tenant - enriquece o contexto de log pra
    // toda a correlacao seguinte (mesmo em caso de senha errada abaixo).
    setTenantId(user.tenantId);

    const passwordOk = await bcrypt.compare(password, user.passwordHash);
    if (!passwordOk) {
      this.logger.warn(`Login negado: senha incorreta para ${email}`);
      throw new UnauthorizedException({
        code: 'AUTH_INVALID_CREDENTIALS',
        title: 'Credenciais inválidas',
        message: 'E-mail ou senha inválidos.',
        recommendedAction: 'Revise as credenciais e tente novamente.',
      });
    }

    this.logger.log(`Login bem-sucedido para ${email}`);

    return this.issueTokens(user);
  }

  async refresh(refreshToken: string) {
    let payload: { sub: string };
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'change-me-too',
      });
    } catch {
      throw new UnauthorizedException({
        code: 'AUTH_INVALID_REFRESH_TOKEN',
        title: 'Sessão expirada',
        message: 'Sua sessão expirou ou é inválida.',
        recommendedAction: 'Faça login novamente.',
      });
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: this.userInclude,
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException({
        code: 'AUTH_INVALID_SESSION',
        title: 'Sessão inválida',
        message: 'Sua sessão não é mais válida.',
        recommendedAction: 'Faça login novamente.',
      });
    }

    setTenantId(user.tenantId);
    this.logger.log(`Token renovado para ${user.email}`);

    return this.issueTokens(user);
  }
}
