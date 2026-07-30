import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { RolesService } from '../src/modules/roles/roles.service';

describe('RolesService', () => {
  let service: RolesService;
  let prisma: {
    role: { findMany: jest.Mock; findFirst: jest.Mock; create: jest.Mock };
    permission: { findFirst: jest.Mock };
    rolePermission: { findFirst: jest.Mock; create: jest.Mock; deleteMany: jest.Mock };
    user: { findFirst: jest.Mock };
    userRole: { findFirst: jest.Mock; create: jest.Mock };
  };

  beforeEach(() => {
    prisma = {
      role: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn() },
      permission: { findFirst: jest.fn() },
      rolePermission: { findFirst: jest.fn(), create: jest.fn(), deleteMany: jest.fn() },
      user: { findFirst: jest.fn() },
      userRole: { findFirst: jest.fn(), create: jest.fn() },
    };

    service = new RolesService(prisma as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('findAllByTenant should query roles by tenantId and flatten permission codes', async () => {
    const tenantId = 'tenant-1';
    const fromPrisma = [
      {
        id: 'role-1',
        code: 'gerente',
        name: 'Gerente',
        description: null,
        rolePermissions: [{ permission: { code: 'clients.read' } }, { permission: { code: 'reports.read' } }],
      },
    ];

    prisma.role.findMany.mockResolvedValue(fromPrisma);

    await expect(service.findAllByTenant(tenantId)).resolves.toEqual([
      {
        id: 'role-1',
        code: 'gerente',
        name: 'Gerente',
        description: null,
        permissionCodes: ['clients.read', 'reports.read'],
      },
    ]);
    expect(prisma.role.findMany).toHaveBeenCalledWith({
      where: { tenantId },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        rolePermissions: { select: { permission: { select: { code: true } } } },
      },
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

  describe('assignReportPermission / revokeReportPermission (escopo reports.manage)', () => {
    it('assignReportPermission should reject a non-"reports." code even if the role/permission would otherwise resolve', async () => {
      await expect(
        service.assignReportPermission('tenant-1', 'role-1', { permissionCode: 'audit.read' }),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.role.findFirst).not.toHaveBeenCalled();
      expect(prisma.rolePermission.create).not.toHaveBeenCalled();
    });

    it('assignReportPermission should reject roles.assign itself (no privilege escalation via this endpoint)', async () => {
      await expect(
        service.assignReportPermission('tenant-1', 'role-1', { permissionCode: 'roles.assign' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('assignReportPermission should delegate to assignPermission for a valid "reports." code', async () => {
      const created = { id: 'link-1', roleId: 'role-1', permissionId: 'perm-1' };
      prisma.role.findFirst.mockResolvedValue({ id: 'role-1', tenantId: 'tenant-1' });
      prisma.permission.findFirst.mockResolvedValue({ id: 'perm-1', code: 'reports.revenue.read' });
      prisma.rolePermission.findFirst.mockResolvedValue(null);
      prisma.rolePermission.create.mockResolvedValue(created);

      await expect(
        service.assignReportPermission('tenant-1', 'role-1', {
          permissionCode: 'reports.revenue.read',
        }),
      ).resolves.toEqual(created);
    });

    it('revokeReportPermission should reject a non-"reports." code', async () => {
      await expect(
        service.revokeReportPermission('tenant-1', 'role-1', 'audit.read'),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.rolePermission.deleteMany).not.toHaveBeenCalled();
    });

    it('revokeReportPermission should throw NotFoundException when the role does not belong to the tenant', async () => {
      prisma.role.findFirst.mockResolvedValue(null);

      await expect(
        service.revokeReportPermission('tenant-1', 'role-x', 'reports.revenue.read'),
      ).rejects.toThrow(NotFoundException);
    });

    it('revokeReportPermission should delete the role-permission link for a valid "reports." code', async () => {
      prisma.role.findFirst.mockResolvedValue({ id: 'role-1', tenantId: 'tenant-1' });
      prisma.permission.findFirst.mockResolvedValue({ id: 'perm-1', code: 'reports.revenue.read' });
      prisma.rolePermission.deleteMany.mockResolvedValue({ count: 1 });

      await expect(
        service.revokeReportPermission('tenant-1', 'role-1', 'reports.revenue.read'),
      ).resolves.toEqual({ removed: true });
      expect(prisma.rolePermission.deleteMany).toHaveBeenCalledWith({
        where: { roleId: 'role-1', permissionId: 'perm-1' },
      });
    });
  });
});
