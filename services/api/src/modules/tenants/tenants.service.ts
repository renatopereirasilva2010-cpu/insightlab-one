import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { buildPhotoUrl } from '../../common/upload/photo-upload.interceptor';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateLogo(callerTenantId: string, tenantId: string, file?: Express.Multer.File) {
    if (callerTenantId !== tenantId) {
      throw new ForbiddenException({
        code: 'TENANT_MISMATCH',
        title: 'Ação não permitida',
        message: 'Você só pode atualizar o logo do seu próprio tenant.',
        recommendedAction: 'Confirme o tenant informado e tente novamente.',
      });
    }

    if (!file) {
      throw new BadRequestException({
        code: 'PHOTO_REQUIRED',
        title: 'Logo obrigatório',
        message: 'Envie uma imagem PNG, JPEG ou WEBP de até 3MB.',
        recommendedAction: 'Selecione um arquivo válido e tente novamente.',
      });
    }

    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: { logoUrl: buildPhotoUrl('tenants', tenantId, file.filename) },
    });
  }
}
