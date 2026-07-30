import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { buildPhotoUrl } from '../../common/upload/photo-upload.interceptor';
import { CreateProfessionalDto } from './dto/create-professional.dto';
import { UpdateProfessionalDto } from './dto/update-professional.dto';

@Injectable()
export class ProfessionalsService {
  constructor(private readonly prisma: PrismaService) {}

  findAllByTenant(tenantId: string) {
    return this.prisma.professional.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(tenantId: string, unitId: string | null, dto: CreateProfessionalDto) {
    return this.prisma.professional.create({
      data: {
        tenantId,
        unitId,
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        roleTitle: dto.roleTitle,
        commissionRate: dto.commissionRate,
        payoutPixKey: dto.payoutPixKey,
        payoutPixKeyType: dto.payoutPixKeyType,
      },
    });
  }

  async update(tenantId: string, professionalId: string, dto: UpdateProfessionalDto) {
    const professional = await this.prisma.professional.findFirst({
      where: { id: professionalId, tenantId },
    });

    if (!professional) {
      throw new NotFoundException({
        code: 'PROFESSIONAL_NOT_FOUND',
        title: 'Profissional não encontrado',
        message: 'Não encontramos o profissional informado para este tenant.',
        recommendedAction: 'Revise o profissional selecionado e tente novamente.',
      });
    }

    return this.prisma.professional.update({
      where: { id: professional.id },
      data: {
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        roleTitle: dto.roleTitle,
        commissionRate: dto.commissionRate,
        status: dto.status,
        onlineBookingEnabled: dto.onlineBookingEnabled,
        payoutPixKey: dto.payoutPixKey,
        payoutPixKeyType: dto.payoutPixKeyType,
      },
    });
  }

  async updatePhoto(tenantId: string, professionalId: string, file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException({
        code: 'PHOTO_REQUIRED',
        title: 'Foto obrigatória',
        message: 'Envie uma imagem PNG, JPEG ou WEBP de até 3MB.',
        recommendedAction: 'Selecione um arquivo válido e tente novamente.',
      });
    }

    const professional = await this.prisma.professional.findFirst({
      where: { id: professionalId, tenantId },
    });

    if (!professional) {
      throw new NotFoundException({
        code: 'PROFESSIONAL_NOT_FOUND',
        title: 'Profissional não encontrado',
        message: 'Não encontramos o profissional informado para este tenant.',
        recommendedAction: 'Revise o profissional selecionado e tente novamente.',
      });
    }

    return this.prisma.professional.update({
      where: { id: professional.id },
      data: { photoUrl: buildPhotoUrl('professionals', tenantId, file.filename) },
    });
  }
}
