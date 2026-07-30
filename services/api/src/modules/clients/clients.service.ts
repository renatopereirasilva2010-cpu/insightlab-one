import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { buildPhotoUrl } from '../../common/upload/photo-upload.interceptor';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  findAllByTenant(tenantId: string) {
    return this.prisma.client.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(tenantId: string, unitId: string | null, dto: CreateClientDto) {
    return this.prisma.client.create({
      data: {
        tenantId,
        unitId,
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        socialName: dto.socialName,
        source: dto.source,
      },
    });
  }

  async update(tenantId: string, clientId: string, dto: UpdateClientDto) {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, tenantId },
    });

    if (!client) {
      throw new NotFoundException({
        code: 'CLIENT_NOT_FOUND',
        title: 'Cliente não encontrado',
        message: 'Não encontramos o cliente informado para este tenant.',
        recommendedAction: 'Revise o cliente selecionado e tente novamente.',
      });
    }

    return this.prisma.client.update({
      where: { id: client.id },
      data: {
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        socialName: dto.socialName,
        source: dto.source,
        status: dto.status,
      },
    });
  }

  async updatePhoto(tenantId: string, clientId: string, file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException({
        code: 'PHOTO_REQUIRED',
        title: 'Foto obrigatória',
        message: 'Envie uma imagem PNG, JPEG ou WEBP de até 3MB.',
        recommendedAction: 'Selecione um arquivo válido e tente novamente.',
      });
    }

    const client = await this.prisma.client.findFirst({
      where: { id: clientId, tenantId },
    });

    if (!client) {
      throw new NotFoundException({
        code: 'CLIENT_NOT_FOUND',
        title: 'Cliente não encontrado',
        message: 'Não encontramos o cliente informado para este tenant.',
        recommendedAction: 'Revise o cliente selecionado e tente novamente.',
      });
    }

    return this.prisma.client.update({
      where: { id: client.id },
      data: { photoUrl: buildPhotoUrl('clients', tenantId, file.filename) },
    });
  }
}
