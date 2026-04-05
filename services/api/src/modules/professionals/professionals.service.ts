import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateProfessionalDto } from './dto/create-professional.dto';

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
      },
    });
  }
}
