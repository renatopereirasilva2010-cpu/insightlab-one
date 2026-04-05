import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceFiscalDto } from './dto/update-service-fiscal.dto';

@Injectable()
export class ServicesCatalogService {
  constructor(private readonly prisma: PrismaService) {}

  findAllByTenant(tenantId: string) {
    return this.prisma.serviceCatalog.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(tenantId: string, unitId: string | null, dto: CreateServiceDto) {
    return this.prisma.serviceCatalog.create({
      data: {
        tenantId,
        unitId,
        name: dto.name,
        description: dto.description,
        durationMinutes: dto.durationMinutes,
        price: dto.price,
        cnaeCode: dto.cnaeCode,
        serviceListItemCode: dto.serviceListItemCode,
        issRate: dto.issRate,
        availableOnline: dto.availableOnline ?? true,
      },
    });
  }

  async updateFiscal(tenantId: string, serviceId: string, dto: UpdateServiceFiscalDto) {
    const hasPayload = Object.values(dto).some((value) => value !== undefined);

    if (!hasPayload) {
      throw new BadRequestException({
        code: 'SERVICE_FISCAL_PAYLOAD_EMPTY',
        title: 'Payload fiscal vazio',
        message: 'Informe pelo menos um campo fiscal para atualizar o serviço.',
        recommendedAction: 'Revise os dados enviados e tente novamente.',
      });
    }

    const service = await this.prisma.serviceCatalog.findFirst({
      where: { id: serviceId, tenantId },
    });

    if (!service) {
      throw new NotFoundException({
        code: 'SERVICE_NOT_FOUND',
        title: 'Serviço não encontrado',
        message: 'Não encontramos o serviço informado para este tenant.',
        recommendedAction: 'Revise o serviço selecionado e tente novamente.',
      });
    }

    return this.prisma.serviceCatalog.update({
      where: { id: service.id },
      data: {
        cnaeCode: dto.cnaeCode,
        serviceListItemCode: dto.serviceListItemCode,
        issRate: dto.issRate,
      },
    });
  }
}