import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AppointmentsService } from '../appointments/appointments.service';
import { CreatePublicAppointmentDto } from './dto/create-public-appointment.dto';

@Injectable()
export class PublicBookingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly appointmentsService: AppointmentsService,
  ) {}

  private async resolveTenant(tenantSlug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant || tenant.status !== 'ACTIVE') {
      throw new NotFoundException({
        code: 'PUBLIC_BOOKING_TENANT_NOT_FOUND',
        title: 'Página não encontrada',
        message: 'Não encontramos essa página de agendamento.',
        recommendedAction: 'Confira o link e tente novamente.',
      });
    }

    return tenant;
  }

  async getBusiness(tenantSlug: string) {
    const tenant = await this.resolveTenant(tenantSlug);
    return { name: tenant.name, slug: tenant.slug };
  }

  async listServices(tenantSlug: string) {
    const tenant = await this.resolveTenant(tenantSlug);

    return this.prisma.serviceCatalog.findMany({
      where: {
        tenantId: tenant.id,
        status: 'ACTIVE',
        availableOnline: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        durationMinutes: true,
        price: true,
        requiresProfessional: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async listProfessionals(tenantSlug: string) {
    const tenant = await this.resolveTenant(tenantSlug);

    return this.prisma.professional.findMany({
      where: {
        tenantId: tenant.id,
        status: 'ACTIVE',
        onlineBookingEnabled: true,
      },
      select: {
        id: true,
        name: true,
        roleTitle: true,
        bio: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async getAvailability(tenantSlug: string, professionalId: string, weekday: number) {
    const tenant = await this.resolveTenant(tenantSlug);

    if (weekday < 0 || weekday > 6) {
      throw new BadRequestException({
        code: 'PUBLIC_BOOKING_INVALID_WEEKDAY',
        title: 'Dia da semana inválido',
        message: 'weekday precisa estar entre 0 e 6.',
        recommendedAction: 'Revise o dia da semana informado e tente novamente.',
      });
    }

    const professional = await this.prisma.professional.findFirst({
      where: {
        id: professionalId,
        tenantId: tenant.id,
        status: 'ACTIVE',
        onlineBookingEnabled: true,
      },
    });

    if (!professional) {
      throw new NotFoundException({
        code: 'PUBLIC_BOOKING_PROFESSIONAL_NOT_FOUND',
        title: 'Profissional não encontrado',
        message: 'Não encontramos esse profissional para agendamento online.',
        recommendedAction: 'Escolha outro profissional e tente novamente.',
      });
    }

    const rules = await this.prisma.professionalAvailability.findMany({
      where: {
        tenantId: tenant.id,
        professionalId,
        weekday,
        active: true,
      },
      select: { startTime: true, endTime: true },
      orderBy: { startTime: 'asc' },
    });

    return { weekday, rules };
  }

  async createAppointment(tenantSlug: string, dto: CreatePublicAppointmentDto) {
    const tenant = await this.resolveTenant(tenantSlug);

    const service = await this.prisma.serviceCatalog.findFirst({
      where: {
        id: dto.serviceId,
        tenantId: tenant.id,
        status: 'ACTIVE',
        availableOnline: true,
      },
    });

    if (!service) {
      throw new NotFoundException({
        code: 'PUBLIC_BOOKING_SERVICE_NOT_FOUND',
        title: 'Serviço não encontrado',
        message: 'Não encontramos esse serviço para agendamento online.',
        recommendedAction: 'Escolha outro serviço e tente novamente.',
      });
    }

    if (dto.professionalId) {
      const professional = await this.prisma.professional.findFirst({
        where: {
          id: dto.professionalId,
          tenantId: tenant.id,
          status: 'ACTIVE',
          onlineBookingEnabled: true,
        },
      });

      if (!professional) {
        throw new NotFoundException({
          code: 'PUBLIC_BOOKING_PROFESSIONAL_NOT_FOUND',
          title: 'Profissional não encontrado',
          message: 'Não encontramos esse profissional para agendamento online.',
          recommendedAction: 'Escolha outro profissional e tente novamente.',
        });
      }
    }

    const startAt = new Date(dto.startAt);
    if (Number.isNaN(startAt.getTime()) || startAt.getTime() <= Date.now()) {
      throw new BadRequestException({
        code: 'PUBLIC_BOOKING_INVALID_START',
        title: 'Horário inválido',
        message: 'O horário do agendamento precisa ser no futuro.',
        recommendedAction: 'Escolha um horário válido e tente novamente.',
      });
    }

    const endAt = new Date(startAt.getTime() + service.durationMinutes * 60000);

    const client = await this.findOrCreateClient(tenant.id, dto);

    return this.appointmentsService.create(
      tenant.id,
      null,
      {
        clientId: client.id,
        serviceId: service.id,
        professionalId: dto.professionalId,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        isWalkIn: false,
        isOverbook: false,
        notes: dto.notes,
      },
      'ONLINE_BOOKING',
    );
  }

  private async findOrCreateClient(tenantId: string, dto: CreatePublicAppointmentDto) {
    const phone = dto.clientPhone.replace(/\D/g, '');

    const existing = await this.prisma.client.findFirst({
      where: { tenantId, phone },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.client.create({
      data: {
        tenantId,
        name: dto.clientName,
        phone,
        email: dto.clientEmail,
        source: 'public-booking',
      },
    });
  }
}
