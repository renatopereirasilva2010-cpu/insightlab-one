import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { QueryAvailabilityDto } from './dto/query-availability.dto';
import { SuggestSlotsDto } from './dto/suggest-slots.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';

const ACTIVE_APPOINTMENT_STATUSES: AppointmentStatus[] = [
  AppointmentStatus.SCHEDULED,
  AppointmentStatus.CONFIRMED,
  AppointmentStatus.CHECKED_IN,
  AppointmentStatus.IN_SERVICE,
];
const SLOT_STEP_MINUTES = 15;
const SUGGESTION_SEARCH_DAYS = 7;
const MAX_SUGGESTIONS = 8;

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

  /**
   * Heuristica simples de sugestao de horario: varre os proximos dias
   * dentro das regras de disponibilidade ativas do profissional, em
   * passos de 15min, descartando o que colide com agendamento ou
   * bloqueio existente. Sem IA, sem otimizacao pesada - resolve a
   * maior parte do caso de uso (evitar o usuario ficar adivinhando
   * horario livre) com uma busca gulosa.
   */
  async suggestSlots(tenantId: string, dto: SuggestSlotsDto) {
    await this.ensureProfessionalExists(tenantId, dto.professionalId);

    const service = await this.prisma.serviceCatalog.findFirst({
      where: { id: dto.serviceId, tenantId },
    });

    if (!service) {
      throw new NotFoundException({
        code: 'SERVICE_NOT_FOUND',
        title: 'Serviço não encontrado',
        message: 'Não encontramos o serviço informado para este tenant.',
        recommendedAction: 'Revise o serviço selecionado e tente novamente.',
      });
    }

    const startDate = dto.fromDate ? new Date(`${dto.fromDate}T00:00:00`) : new Date();
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + SUGGESTION_SEARCH_DAYS);

    const rules = await this.prisma.professionalAvailability.findMany({
      where: { tenantId, professionalId: dto.professionalId, active: true },
    });

    if (rules.length === 0) {
      return { suggestions: [] };
    }

    const rulesByWeekday = new Map<number, typeof rules>();
    for (const rule of rules) {
      const list = rulesByWeekday.get(rule.weekday) ?? [];
      list.push(rule);
      rulesByWeekday.set(rule.weekday, list);
    }

    const [appointments, blocks] = await Promise.all([
      this.prisma.appointment.findMany({
        where: {
          tenantId,
          professionalId: dto.professionalId,
          status: { in: ACTIVE_APPOINTMENT_STATUSES },
          startAt: { lt: endDate },
          endAt: { gt: startDate },
        },
        select: { startAt: true, endAt: true },
      }),
      this.prisma.appointmentBlock.findMany({
        where: {
          tenantId,
          professionalId: dto.professionalId,
          active: true,
          startsAt: { lt: endDate },
          endsAt: { gt: startDate },
        },
        select: { startsAt: true, endsAt: true },
      }),
    ]);

    const busyRanges = [
      ...appointments.map((a) => ({ start: a.startAt, end: a.endAt })),
      ...blocks.map((b) => ({ start: b.startsAt, end: b.endsAt })),
    ];

    const durationMs = service.durationMinutes * 60000;
    const now = new Date();
    const suggestions: { startAt: string; endAt: string }[] = [];

    for (let day = 0; day < SUGGESTION_SEARCH_DAYS && suggestions.length < MAX_SUGGESTIONS; day++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + day);
      const dayRules = rulesByWeekday.get(date.getDay()) ?? [];

      for (const rule of dayRules) {
        const [startHour, startMinute] = rule.startTime.split(':').map(Number);
        const [endHour, endMinute] = rule.endTime.split(':').map(Number);

        const cursor = new Date(date);
        cursor.setHours(startHour, startMinute, 0, 0);
        const ruleEnd = new Date(date);
        ruleEnd.setHours(endHour, endMinute, 0, 0);

        while (
          cursor.getTime() + durationMs <= ruleEnd.getTime() &&
          suggestions.length < MAX_SUGGESTIONS
        ) {
          const slotStart = new Date(cursor);
          const slotEnd = new Date(cursor.getTime() + durationMs);

          if (slotStart.getTime() > now.getTime()) {
            const overlaps = busyRanges.some(
              (range) => slotStart < range.end && slotEnd > range.start,
            );

            if (!overlaps) {
              suggestions.push({
                startAt: slotStart.toISOString(),
                endAt: slotEnd.toISOString(),
              });
            }
          }

          cursor.setTime(cursor.getTime() + SLOT_STEP_MINUTES * 60000);
        }
      }
    }

    return { suggestions };
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