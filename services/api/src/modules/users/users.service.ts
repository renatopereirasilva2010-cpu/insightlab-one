import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const userSelect = {
  id: true,
  name: true,
  email: true,
  status: true,
  unitId: true,
  createdAt: true,
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByTenant(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId },
      select: userSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(tenantId: string, dto: CreateUserDto) {
    const passwordHash = await bcrypt.hash(dto.password, 10);

    try {
      return await this.prisma.user.create({
        data: {
          tenantId,
          unitId: dto.unitId,
          name: dto.name,
          email: dto.email,
          phone: dto.phone,
          passwordHash,
        },
        select: userSelect,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException({
          code: 'USER_EMAIL_DUPLICATE',
          title: 'E-mail já cadastrado',
          message: 'Já existe um usuário com este e-mail.',
          recommendedAction: 'Revise o e-mail informado ou edite o usuário existente.',
        });
      }
      throw error;
    }
  }

  async update(tenantId: string, userId: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
    });

    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        title: 'Usuário não encontrado',
        message: 'Não encontramos o usuário informado para este tenant.',
        recommendedAction: 'Revise o usuário selecionado e tente novamente.',
      });
    }

    return this.prisma.user.update({
      where: { id: user.id },
      data: {
        name: dto.name,
        phone: dto.phone,
        unitId: dto.unitId,
        status: dto.status,
      },
      select: userSelect,
    });
  }

  async block(tenantId: string, userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
    });

    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        title: 'Usuário não encontrado',
        message: 'Não encontramos o usuário informado para este tenant.',
        recommendedAction: 'Revise o usuário selecionado e tente novamente.',
      });
    }

    return this.prisma.user.update({
      where: { id: user.id },
      data: { status: 'BLOCKED' },
      select: userSelect,
    });
  }
}
