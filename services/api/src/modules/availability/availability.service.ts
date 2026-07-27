import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { QueryAvailabilityDto } from './dto/query-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';

@Injectable()
export class AvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  async query(tenantId: string, dto: QueryAvailabilityDto) {
    const date = new Date(dto.date);
    const weekday = date.getUTCDay();

    const availabilities = await this.prisma.professionalAvailability.findMany({
      where: {
        tenantId,
        professionalId: dto.professionalId,
        weekday,
      },
      orderBy: { startTime: 'asc' },
    });

    return {
      date: dto.date,
      weekday,
      totalRules: availabilities.length,
      rules: availabilities,
    };
  }

  async create(tenantId: string, unitId: string | null, dto: CreateAvailabilityDto) {
    this.assertWeekday(dto.weekday);
    this.assertTimeRange(dto.startTime, dto.endTime);

    await this.ensureProfessionalExists(tenantId, dto.professionalId);
    await this.ensureNoOverlap({
      tenantId,
      professionalId: dto.professionalId,
      weekday: dto.weekday,
      startTime: dto.startTime,
      endTime: dto.endTime,
      active: dto.active ?? true,
    });

    return this.prisma.professionalAvailability.create({
      data: {
        tenantId,
        unitId,
        professionalId: dto.professionalId,
        weekday: dto.weekday,
        startTime: dto.startTime,
        endTime: dto.endTime,
        active: dto.active ?? true,
      },
    });
  }

  async update(tenantId: string, availabilityId: string, dto: UpdateAvailabilityDto) {
    const current = await this.prisma.professionalAvailability.findFirst({
      where: { id: availabilityId, tenantId },
    });

    if (!current) {
      throw new NotFoundException({
        code: 'AVAILABILITY_NOT_FOUND',
        title: 'Disponibilidade não encontrada',
        message: 'Não encontramos a disponibilidade informada.',
        recommendedAction: 'Atualize a agenda e tente novamente.',
      });
    }

    const nextProfessionalId = dto.professionalId ?? current.professionalId;
    const nextWeekday = dto.weekday ?? current.weekday;
    const nextStartTime = dto.startTime ?? current.startTime;
    const nextEndTime = dto.endTime ?? current.endTime;
    const nextActive = dto.active ?? current.active;

    this.assertWeekday(nextWeekday);
    this.assertTimeRange(nextStartTime, nextEndTime);

    await this.ensureProfessionalExists(tenantId, nextProfessionalId);
    await this.ensureNoOverlap({
      tenantId,
      professionalId: nextProfessionalId,
      weekday: nextWeekday,
      startTime: nextStartTime,
      endTime: nextEndTime,
      active: nextActive,
      excludeId: current.id,
    });

    return this.prisma.professionalAvailability.update({
      where: { id: current.id },
      data: {
        professionalId: dto.professionalId,
        weekday: dto.weekday,
        startTime: dto.startTime,
        endTime: dto.endTime,
        active: dto.active,
      },
    });
  }

  private assertWeekday(weekday: number) {
    if (weekday < 0 || weekday > 6) {
      throw new BadRequestException({
        code: 'AVAILABILITY_INVALID_WEEKDAY',
        title: 'Dia da semana inválido',
        message: 'weekday precisa estar entre 0 e 6.',
        recommendedAction: 'Revise o dia da semana informado e tente novamente.',
      });
    }
  }

  private assertTimeRange(startTime: string, endTime: string) {
    if (endTime <= startTime) {
      throw new BadRequestException({
        code: 'AVAILABILITY_INVALID_RANGE',
        title: 'Intervalo inválido',
        message: 'O horário final precisa ser maior que o horário inicial.',
        recommendedAction: 'Revise o intervalo informado e tente novamente.',
      });
    }
  }

  private async ensureProfessionalExists(tenantId: string, professionalId: string) {
    const professional = await this.prisma.professional.findFirst({
      where: {
        id: professionalId,
        tenantId,
      },
    });

    if (!professional) {
      throw new BadRequestException({
        code: 'PROFESSIONAL_NOT_FOUND',
        title: 'Profissional não encontrado',
        message: 'O profissional informado não pertence ao tenant atual.',
        recommendedAction: 'Revise o profissional informado e tente novamente.',
      });
    }
  }

  private async ensureNoOverlap(params: {
    tenantId: string;
    professionalId: string;
    weekday: number;
    startTime: string;
    endTime: string;
    active: boolean;
    excludeId?: string;
  }) {
    if (!params.active) {
      return;
    }

    const conflict = await this.prisma.professionalAvailability.findFirst({
      where: {
        tenantId: params.tenantId,
        professionalId: params.professionalId,
        weekday: params.weekday,
        active: true,
        id: params.excludeId ? { not: params.excludeId } : undefined,
        startTime: { lt: params.endTime },
        endTime: { gt: params.startTime },
      },
    });

    if (conflict) {
      throw new BadRequestException({
        code: 'AVAILABILITY_CONFLICT',
        title: 'Conflito de disponibilidade',
        message: 'Já existe uma regra ativa de disponibilidade neste intervalo para o profissional.',
        recommendedAction: 'Revise o horário informado ou inative a regra conflitante.',
      });
    }
  }
}