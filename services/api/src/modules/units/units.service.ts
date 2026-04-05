import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UpdateUnitFiscalDto } from './dto/update-unit-fiscal.dto';

@Injectable()
export class UnitsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByTenant(tenantId: string) {
    return this.prisma.unit.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        code: true,
        legalName: true,
        tradeName: true,
        cnpj: true,
        municipalRegistration: true,
        stateRegistration: true,
        addressLine1: true,
        addressNumber: true,
        addressComplement: true,
        district: true,
        city: true,
        state: true,
        postalCode: true,
        ibgeCityCode: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateFiscal(tenantId: string, unitId: string, dto: UpdateUnitFiscalDto) {
    const hasPayload = Object.values(dto).some((value) => value !== undefined);

    if (!hasPayload) {
      throw new BadRequestException({
        code: 'UNIT_FISCAL_PAYLOAD_EMPTY',
        title: 'Payload fiscal vazio',
        message: 'Informe pelo menos um campo fiscal para atualizar a unidade.',
        recommendedAction: 'Revise os dados enviados e tente novamente.',
      });
    }

    const unit = await this.prisma.unit.findFirst({
      where: { id: unitId, tenantId },
    });

    if (!unit) {
      throw new NotFoundException({
        code: 'UNIT_NOT_FOUND',
        title: 'Unidade não encontrada',
        message: 'Não encontramos a unidade informada para este tenant.',
        recommendedAction: 'Revise a unidade selecionada e tente novamente.',
      });
    }

    return this.prisma.unit.update({
      where: { id: unit.id },
      data: {
        legalName: dto.legalName,
        tradeName: dto.tradeName,
        cnpj: dto.cnpj,
        municipalRegistration: dto.municipalRegistration,
        stateRegistration: dto.stateRegistration,
        addressLine1: dto.addressLine1,
        addressNumber: dto.addressNumber,
        addressComplement: dto.addressComplement,
        district: dto.district,
        city: dto.city,
        state: dto.state,
        postalCode: dto.postalCode,
        ibgeCityCode: dto.ibgeCityCode,
      },
      select: {
        id: true,
        tenantId: true,
        name: true,
        code: true,
        legalName: true,
        tradeName: true,
        cnpj: true,
        municipalRegistration: true,
        stateRegistration: true,
        addressLine1: true,
        addressNumber: true,
        addressComplement: true,
        district: true,
        city: true,
        state: true,
        postalCode: true,
        ibgeCityCode: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}