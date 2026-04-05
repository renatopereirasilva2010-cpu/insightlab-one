import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateAppointmentBlockDto } from './dto/create-appointment-block.dto';

@Injectable()
export class AppointmentBlocksService {
  constructor(private readonly prisma: PrismaService) {}

  findAllByTenant(tenantId: string) {
    return this.prisma.appointmentBlock.findMany({
      where: { tenantId, active: true },
      orderBy: { startsAt: 'asc' },
    });
  }

  create(tenantId: string, unitId: string | null, dto: CreateAppointmentBlockDto) {
    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);

    if (endsAt <= startsAt) {
      throw new BadRequestException({
        code: 'BLOCK_INVALID_RANGE',
        title: 'Intervalo inválido',
        message: 'O bloqueio precisa ter fim posterior ao início.',
        recommendedAction: 'Revise os horários do bloqueio e tente novamente.',
      });
    }

    return this.prisma.appointmentBlock.create({
      data: {
        tenantId,
        unitId,
        professionalId: dto.professionalId,
        resourceId: dto.resourceId,
        startsAt,
        endsAt,
        reason: dto.reason,
      },
    });
  }
}
