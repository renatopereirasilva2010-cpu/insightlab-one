import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { RolesService } from '../src/modules/roles/roles.service';

describe('RolesService', () => {
  let service: RolesService;
  let prisma: {
    role: { findMany: jest.Mock; findFirst: jest.Mock; create: jest.Mock };
    permission: { findFirst: jest.Mock };
    rolePermission: { findFirst: jest.Mock; create: jest.Mock };
    user: { findFirst: jest.Mock };
    userRole: { findFirst: jest.Mock; create: jest.Mock };
  };

  beforeEach(() => {
    prisma = {
      role: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn() },
      permission: { findFirst: jest.fn() },
      rolePermission: { findFirst: jest.fn(), create: jest.fn() },
      user: { findFirst: jest.fn() },
      userRole: { findFirst: jest.fn(), create: jest.fn() },
    };

    service = new RolesService(prisma as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('findAllByTenant should query roles by tenantId', async () => {
    const tenantId = 'tenant-1';
    const expected = [{ id: 'role-1', code: 'gerente' }];

    prisma.role.findMany.mockResolvedValue(expected);

    await expect(service.findAllByTenant(tenantId)).resolves.toEqual(expected);
    expect(prisma.role.findMany).toHaveBeenCalledWith({
      where: { tenantId },
      select: { id: true, code: true, name: true, description: true },
      orderBy: { name: 'asc' },
    });
  });

  it('create should persist the role payload', async () => {
    const dto = { code: 'estoquista', name: 'Estoquista', description: undefined };
    const created = { id: 'role-1', tenantId: 'tenant-1', ...dto };

    prisma.role.create.mockResolvedValue(created);

    await expect(service.create('tenant-1', dto as any)).resolves.toEqual(created);
    expect(prisma.role.create).toHaveBeenCalledWith({
      data: { tenantId: 'tenant-1', code: dto.code, name: dto.name, description: dto.description },
    });
  });

  it('create should throw BadRequestException when the role code already exists for the tenant', async () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: '5.0.0',
    });

    prisma.role.create.mockRejectedValue(prismaError);

    await expect(
      service.create('tenant-1', { code: 'gerente', name: 'Gerente' } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('assignPermission should throw NotFoundException when the role does not belong to the tenant', async () => {
    prisma.role.findFirst.mockResolvedValue(null);

    await expect(
      service.assignPermission('tenant-1', 'role-x', { permissionCode: 'clients.read' }),
    ).rejects.toThrow(NotFoundException);
    expect(prisma.permission.findFirst).not.toHaveBeenCalled();
  });

  it('assignPermission should throw NotFoundException when the permission code does not exist', async () => {
    prisma.role.findFirst.mockResolvedValue({ id: 'role-1', tenantId: 'tenant-1' });
    prisma.permission.findFirst.mockResolvedValue(null);

    await expect(
      service.assignPermission('tenant-1', 'role-1', { permissionCode: 'bogus.code' }),
    ).rejects.toThrow(NotFoundException);
    expect(prisma.rolePermission.create).not.toHaveBeenCalled();
  });

  it('assignPermission should return the existing link when already assigned', async () => {
    const existingLink = { id: 'link-1', roleId: 'role-1', permissionId: 'perm-1' };

    prisma.role.findFirst.mockResolvedValue({ id: 'role-1', tenantId: 'tenant-1' });
    prisma.permission.findFirst.mockResolvedValue({ id: 'perm-1', code: 'clients.read' });
    prisma.rolePermission.findFirst.mockResolvedValue(existingLink);

    await expect(
      service.assignPermission('tenant-1', 'role-1', { permissionCode: 'clients.read' }),
    ).resolves.toEqual(existingLink);
    expect(prisma.rolePermission.create).not.toHaveBeenCalled();
  });

  it('assignPermission should create a new link when not yet assigned', async () => {
    const created = { id: 'link-1', roleId: 'role-1', permissionId: 'perm-1' };

    prisma.role.findFirst.mockResolvedValue({ id: 'role-1', tenantId: 'tenant-1' });
    prisma.permission.findFirst.mockResolvedValue({ id: 'perm-1', code: 'clients.read' });
    prisma.rolePermission.findFirst.mockResolvedValue(null);
    prisma.rolePermission.create.mockResolvedValue(created);

    await expect(
      service.assignPermission('tenant-1', 'role-1', { permissionCode: 'clients.read' }),
    ).resolves.toEqual(created);
    expect(prisma.rolePermission.create).toHaveBeenCalledWith({
      data: { roleId: 'role-1', permissionId: 'perm-1' },
    });
  });

  it('assignUser should throw NotFoundException when the role does not belong to the tenant', async () => {
    prisma.role.findFirst.mockResolvedValue(null);

    await expect(service.assignUser('tenant-1', 'role-x', { userId: 'user-1' })).rejects.toThrow(
      NotFoundException,
    );
    expect(prisma.user.findFirst).not.toHaveBeenCalled();
  });

  it('assignUser should throw NotFoundException when the user does not belong to the tenant', async () => {
    prisma.role.findFirst.mockResolvedValue({ id: 'role-1', tenantId: 'tenant-1' });
    prisma.user.findFirst.mockResolvedValue(null);

    await expect(service.assignUser('tenant-1', 'role-1', { userId: 'user-x' })).rejects.toThrow(
      NotFoundException,
    );
    expect(prisma.userRole.create).not.toHaveBeenCalled();
  });

  it('assignUser should return the existing link when already assigned', async () => {
    const existingLink = { id: 'ur-1', userId: 'user-1', roleId: 'role-1' };

    prisma.role.findFirst.mockResolvedValue({ id: 'role-1', tenantId: 'tenant-1' });
    prisma.user.findFirst.mockResolvedValue({ id: 'user-1', tenantId: 'tenant-1' });
    prisma.userRole.findFirst.mockResolvedValue(existingLink);

    await expect(
      service.assignUser('tenant-1', 'role-1', { userId: 'user-1' }),
    ).resolves.toEqual(existingLink);
    expect(prisma.userRole.create).not.toHaveBeenCalled();
  });

  it('assignUser should create a new link when not yet assigned', async () => {
    const created = { id: 'ur-1', userId: 'user-1', roleId: 'role-1' };

    prisma.role.findFirst.mockResolvedValue({ id: 'role-1', tenantId: 'tenant-1' });
    prisma.user.findFirst.mockResolvedValue({ id: 'user-1', tenantId: 'tenant-1' });
    prisma.userRole.findFirst.mockResolvedValue(null);
    prisma.userRole.create.mockResolvedValue(created);

    await expect(
      service.assignUser('tenant-1', 'role-1', { userId: 'user-1' }),
    ).resolves.toEqual(created);
    expect(prisma.userRole.create).toHaveBeenCalledWith({
      data: { userId: 'user-1', roleId: 'role-1' },
    });
  });
});
