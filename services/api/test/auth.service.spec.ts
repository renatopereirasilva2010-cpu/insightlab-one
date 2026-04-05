import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
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

  it('bcrypt should hash and compare properly', async () => {
    const password = 'Admin@12345';
    const hash = await bcrypt.hash(password, 10);
    const ok = await bcrypt.compare(password, hash);
    expect(ok).toBe(true);
  });
});