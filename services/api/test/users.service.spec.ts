import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../src/modules/users/users.service';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: {
    user: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    professional: {
      findFirst: jest.Mock;
    };
  };

  beforeEach(() => {
    prisma = {
      user: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      professional: {
        findFirst: jest.fn(),
      },
    };

    service = new UsersService(prisma as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('findAllByTenant should query users by tenantId', async () => {
    const tenantId = 'tenant-1';
    const expected = [{ id: 'user-1', tenantId }];

    prisma.user.findMany.mockResolvedValue(expected);

    await expect(service.findAllByTenant(tenantId)).resolves.toEqual(expected);
    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        socialName: true,
        email: true,
        status: true,
        unitId: true,
        professionalId: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('create should hash the password and persist the user payload', async () => {
    const tenantId = 'tenant-1';
    const dto = { name: 'Ana', email: 'ana@mix-demo.local', password: 'Segura@123', phone: undefined, unitId: undefined };
    const created = { id: 'user-1', name: dto.name, email: dto.email };

    prisma.user.create.mockResolvedValue(created);

    await expect(service.create(tenantId, dto as any)).resolves.toEqual(created);

    const createArgs = prisma.user.create.mock.calls[0][0];
    expect(createArgs.data.tenantId).toBe(tenantId);
    expect(createArgs.data.email).toBe(dto.email);
    expect(createArgs.data.name).toBe(dto.name);
    expect(createArgs.data.passwordHash).not.toBe(dto.password);
    await expect(bcrypt.compare(dto.password, createArgs.data.passwordHash)).resolves.toBe(true);
    expect(createArgs.select).toEqual({
      id: true,
      name: true,
      socialName: true,
      email: true,
      status: true,
      unitId: true,
      professionalId: true,
      createdAt: true,
    });
  });

  it('create should throw BadRequestException when the email is already in use', async () => {
    const dto = { name: 'Ana', email: 'dup@mix-demo.local', password: 'Segura@123' };
    const prismaError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: '5.0.0',
    });

    prisma.user.create.mockRejectedValue(prismaError);

    await expect(service.create('tenant-1', dto as any)).rejects.toThrow(BadRequestException);
  });

  it('update should throw NotFoundException when the user does not belong to the tenant', async () => {
    prisma.user.findFirst.mockResolvedValue(null);

    await expect(service.update('tenant-1', 'user-x', { name: 'Nova' } as any)).rejects.toThrow(
      NotFoundException,
    );
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('update should persist the changed fields for a user scoped to the tenant', async () => {
    const existing = { id: 'user-1', tenantId: 'tenant-1', name: 'Ana' };
    const dto = { name: 'Ana Paula', status: 'INACTIVE' };
    const updated = { ...existing, ...dto };

    prisma.user.findFirst.mockResolvedValue(existing);
    prisma.user.update.mockResolvedValue(updated);

    await expect(service.update('tenant-1', 'user-1', dto as any)).resolves.toEqual(updated);
    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: { id: 'user-1', tenantId: 'tenant-1' },
    });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        name: 'Ana Paula',
        phone: undefined,
        unitId: undefined,
        status: 'INACTIVE',
        professionalId: undefined,
      },
      select: {
        id: true,
        name: true,
        socialName: true,
        email: true,
        status: true,
        unitId: true,
        professionalId: true,
        createdAt: true,
      },
    });
  });

  it('update should throw NotFoundException when professionalId does not belong to the tenant', async () => {
    prisma.user.findFirst.mockResolvedValue({ id: 'user-1', tenantId: 'tenant-1' });
    prisma.professional.findFirst.mockResolvedValue(null);

    await expect(
      service.update('tenant-1', 'user-1', { professionalId: 'prof-x' } as any),
    ).rejects.toThrow(NotFoundException);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('update should reject linking a professional already linked to another user', async () => {
    prisma.user.findFirst.mockResolvedValue({ id: 'user-1', tenantId: 'tenant-1' });
    prisma.professional.findFirst.mockResolvedValue({ id: 'prof-1', tenantId: 'tenant-1' });
    const prismaError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: '5.0.0',
    });
    prisma.user.update.mockRejectedValue(prismaError);

    await expect(
      service.update('tenant-1', 'user-1', { professionalId: 'prof-1' } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('update should link a valid professional to the user', async () => {
    prisma.user.findFirst.mockResolvedValue({ id: 'user-1', tenantId: 'tenant-1' });
    prisma.professional.findFirst.mockResolvedValue({ id: 'prof-1', tenantId: 'tenant-1' });
    prisma.user.update.mockResolvedValue({ id: 'user-1', professionalId: 'prof-1' });

    await expect(
      service.update('tenant-1', 'user-1', { professionalId: 'prof-1' } as any),
    ).resolves.toEqual({ id: 'user-1', professionalId: 'prof-1' });
    expect(prisma.professional.findFirst).toHaveBeenCalledWith({
      where: { id: 'prof-1', tenantId: 'tenant-1' },
    });
  });

  it('block should throw NotFoundException when the user does not belong to the tenant', async () => {
    prisma.user.findFirst.mockResolvedValue(null);

    await expect(service.block('tenant-1', 'user-x')).rejects.toThrow(NotFoundException);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('block should set the user status to BLOCKED', async () => {
    const existing = { id: 'user-1', tenantId: 'tenant-1', status: 'ACTIVE' };
    const updated = { ...existing, status: 'BLOCKED' };

    prisma.user.findFirst.mockResolvedValue(existing);
    prisma.user.update.mockResolvedValue(updated);

    await expect(service.block('tenant-1', 'user-1')).resolves.toEqual(updated);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { status: 'BLOCKED' },
      select: {
        id: true,
        name: true,
        socialName: true,
        email: true,
        status: true,
        unitId: true,
        professionalId: true,
        createdAt: true,
      },
    });
  });
});
