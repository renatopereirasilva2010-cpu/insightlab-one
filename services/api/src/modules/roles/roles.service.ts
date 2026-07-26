import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AssignPermissionDto } from './dto/assign-permission.dto';
import { AssignUserDto } from './dto/assign-user.dto';
import { CreateRoleDto } from './dto/create-role.dto';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByTenant(tenantId: string) {
    return this.prisma.role.findMany({
      where: { tenantId },
      select: { id: true, code: true, name: true, description: true },
      orderBy: { name: 'asc' },
    });
  }

  async create(tenantId: string, dto: CreateRoleDto) {
    try {
      return await this.prisma.role.create({
        data: {
          tenantId,
          code: dto.code,
          name: dto.name,
          description: dto.description,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException({
          code: 'ROLE_CODE_DUPLICATE',
          title: 'Papel já cadastrado',
          message: 'Já existe um papel com este código para este tenant.',
          recommendedAction: 'Revise o código informado ou edite o papel existente.',
        });
      }
      throw error;
    }
  }

  async assignPermission(tenantId: string, roleId: string, dto: AssignPermissionDto) {
    const role = await this.prisma.role.findFirst({ where: { id: roleId, tenantId } });

    if (!role) {
      throw new NotFoundException({
        code: 'ROLE_NOT_FOUND',
        title: 'Papel não encontrado',
        message: 'Não encontramos o papel informado para este tenant.',
        recommendedAction: 'Revise o papel selecionado e tente novamente.',
      });
    }

    const permission = await this.prisma.permission.findFirst({
      where: { code: dto.permissionCode },
    });

    if (!permission) {
      throw new NotFoundException({
        code: 'PERMISSION_NOT_FOUND',
        title: 'Permissão não encontrada',
        message: 'Não encontramos a permissão informada.',
        recommendedAction: 'Revise o código de permissão e tente novamente.',
      });
    }

    const existing = await this.prisma.rolePermission.findFirst({
      where: { roleId: role.id, permissionId: permission.id },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.rolePermission.create({
      data: { roleId: role.id, permissionId: permission.id },
    });
  }

  async assignUser(tenantId: string, roleId: string, dto: AssignUserDto) {
    const role = await this.prisma.role.findFirst({ where: { id: roleId, tenantId } });

    if (!role) {
      throw new NotFoundException({
        code: 'ROLE_NOT_FOUND',
        title: 'Papel não encontrado',
        message: 'Não encontramos o papel informado para este tenant.',
        recommendedAction: 'Revise o papel selecionado e tente novamente.',
      });
    }

    const user = await this.prisma.user.findFirst({
      where: { id: dto.userId, tenantId },
    });

    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        title: 'Usuário não encontrado',
        message: 'Não encontramos o usuário informado para este tenant.',
        recommendedAction: 'Revise o usuário selecionado e tente novamente.',
      });
    }

    const existing = await this.prisma.userRole.findFirst({
      where: { userId: user.id, roleId: role.id },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.userRole.create({
      data: { userId: user.id, roleId: role.id },
    });
  }
}
