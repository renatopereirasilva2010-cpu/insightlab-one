import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';

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
}
