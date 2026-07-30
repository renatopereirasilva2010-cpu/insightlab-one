import { UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuthService } from '../src/modules/auth/auth.service';
import { PrismaService } from '../src/database/prisma.service';

describe('AuthService', () => {
  it('should be defined', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {},
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn().mockResolvedValue('token'),
          },
        },
      ],
    }).compile();

    const service = moduleRef.get(AuthService);
    expect(service).toBeDefined();
  });

  it('bcryptjs should hash and compare properly', async () => {
    const password = 'Admin@12345';
    const hash = await bcrypt.hash(password, 10);
    const ok = await bcrypt.compare(password, hash);
    expect(ok).toBe(true);
  });

  it('bcryptjs verifies hashes produced by the old native bcrypt library (migration compatibility)', async () => {
    // Hash real do admin@mix-demo.local, gerado pelo pacote nativo `bcrypt` antes da
    // migracao pra bcryptjs (consultado direto no banco) - prova que o hash existente
    // continua valido, sem precisar re-hashear nenhum usuario.
    const legacyBcryptHash = '$2b$10$lTK5xsfrWga6wwIeN0Z3lOY6683GkczGbgdfKMYZcmMafmh.mRpgi';
    const ok = await bcrypt.compare('Admin@12345', legacyBcryptHash);
    expect(ok).toBe(true);
  });

  describe('refresh', () => {
    function buildUser(overrides: Partial<any> = {}) {
      return {
        id: 'user-1',
        email: 'admin@mix-demo.local',
        tenantId: 't-1',
        unitId: 'u-1',
        status: 'ACTIVE',
        userRoles: [
          { role: { rolePermissions: [{ permission: { code: 'payments.read' } }] } },
        ],
        ...overrides,
      };
    }

    it('issues a new access/refresh token pair for a valid refresh token', async () => {
      const prisma = { user: { findUnique: jest.fn().mockResolvedValue(buildUser()) } };
      const jwt = {
        verifyAsync: jest.fn().mockResolvedValue({ sub: 'user-1' }),
        signAsync: jest.fn().mockResolvedValue('new-token'),
      };
      const service = new AuthService(prisma as any, jwt as any);

      const result = await service.refresh('valid-refresh-token');

      expect(jwt.verifyAsync).toHaveBeenCalledWith('valid-refresh-token', expect.any(Object));
      expect(result.accessToken).toBe('new-token');
      expect(result.refreshToken).toBe('new-token');
      expect(result.user).toEqual({
        id: 'user-1',
        email: 'admin@mix-demo.local',
        tenantId: 't-1',
        unitId: 'u-1',
        permissions: ['payments.read'],
      });
    });

    it('rejects an invalid/expired refresh token', async () => {
      const prisma = { user: { findUnique: jest.fn() } };
      const jwt = { verifyAsync: jest.fn().mockRejectedValue(new Error('expired')) };
      const service = new AuthService(prisma as any, jwt as any);

      await expect(service.refresh('bad-token')).rejects.toThrow(UnauthorizedException);
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('rejects refresh for a user that no longer exists', async () => {
      const prisma = { user: { findUnique: jest.fn().mockResolvedValue(null) } };
      const jwt = { verifyAsync: jest.fn().mockResolvedValue({ sub: 'ghost' }) };
      const service = new AuthService(prisma as any, jwt as any);

      await expect(service.refresh('token')).rejects.toThrow(UnauthorizedException);
    });

    it('rejects refresh for a blocked/inactive user', async () => {
      const prisma = {
        user: { findUnique: jest.fn().mockResolvedValue(buildUser({ status: 'BLOCKED' })) },
      };
      const jwt = { verifyAsync: jest.fn().mockResolvedValue({ sub: 'user-1' }) };
      const service = new AuthService(prisma as any, jwt as any);

      await expect(service.refresh('token')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('me', () => {
    it('returns name/email/professionalId, flattened roles and tenant branding', async () => {
      const prisma = {
        user: {
          findUnique: jest.fn().mockResolvedValue({
            name: 'Gerente Demo',
            socialName: null,
            email: 'gerente.demo@mix-demo.local',
            professionalId: null,
            professional: null,
            userRoles: [{ role: { id: 'role-1', name: 'Gerente' } }],
            tenant: { name: 'Mix Demo', logoUrl: '/uploads/tenants/t-1/logo.png' },
          }),
        },
      };
      const service = new AuthService(prisma as any, {} as any);

      await expect(service.me('user-1')).resolves.toEqual({
        name: 'Gerente Demo',
        socialName: null,
        email: 'gerente.demo@mix-demo.local',
        professionalId: null,
        photoUrl: null,
        roles: [{ id: 'role-1', name: 'Gerente' }],
        tenant: { name: 'Mix Demo', logoUrl: '/uploads/tenants/t-1/logo.png' },
      });
    });

    it('surfaces the linked professional photo when present', async () => {
      const prisma = {
        user: {
          findUnique: jest.fn().mockResolvedValue({
            name: 'Priscila',
            email: 'priscila@mix-demo.local',
            professionalId: 'prof-1',
            professional: { photoUrl: '/uploads/professionals/t-1/prof-1-1.png' },
            userRoles: [{ role: { id: 'role-2', name: 'Profissional' } }],
            tenant: { name: 'Mix Demo', logoUrl: null },
          }),
        },
      };
      const service = new AuthService(prisma as any, {} as any);

      const result = await service.me('user-2');
      expect(result.photoUrl).toBe('/uploads/professionals/t-1/prof-1-1.png');
    });

    it('rejects when the user no longer exists', async () => {
      const prisma = { user: { findUnique: jest.fn().mockResolvedValue(null) } };
      const service = new AuthService(prisma as any, {} as any);

      await expect(service.me('ghost')).rejects.toThrow(UnauthorizedException);
    });
  });
});