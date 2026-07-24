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
});