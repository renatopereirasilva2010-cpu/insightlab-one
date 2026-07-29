import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

const ACTIVE_APPOINTMENT_STATUSES: AppointmentStatus[] = [
  AppointmentStatus.SCHEDULED,
  AppointmentStatus.CONFIRMED,
  AppointmentStatus.CHECKED_IN,
  AppointmentStatus.IN_SERVICE,
];
const LOCKED_APPOINTMENT_STATUSES: AppointmentStatus[] = [
  AppointmentStatus.CANCELED,
  AppointmentStatus.NO_SHOW,
  AppointmentStatus.COMPLETED,
];

type AppointmentAction = 'cancel' | 'markNoShow';
type AppointmentTransitionOutcome =
  | 'ALLOW'
  | 'ALREADY_CANCELED'
  | 'ALREADY_NO_SHOW'
  | 'INVALID_TRANSITION';

type AppointmentTransitionStatus = 'SCHEDULED' | 'CANCELED' | 'NO_SHOW';

const APPOINTMENT_TRANSITIONS: Record<
  AppointmentTransitionStatus,
  Record<AppointmentAction, AppointmentTransitionOutcome>
> = {
  SCHEDULED: {
    cancel: 'ALLOW',
    markNoShow: 'ALLOW',
  },
  CANCELED: {
    cancel: 'ALREADY_CANCELED',
    markNoShow: 'INVALID_TRANSITION',
  },
  NO_SHOW: {
    cancel: 'INVALID_TRANSITION',
    markNoShow: 'ALREADY_NO_SHOW',
  },
};

@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  private assertTransitionAllowed(currentStatus: string, action: AppointmentAction): void {
    const transition = APPOINTMENT_TRANSITIONS[currentStatus as AppointmentTransitionStatus];

    // Para este corte do R1.1, estados fora da matriz seguem permitidos.
    // Ex.: CONFIRMED, CHECKED_IN, IN_SERVICE.
    if (!transition) {
      return;
    }

    const outcome = transition[action];

    if (outcome === 'ALLOW') {
      return;
    }

    if (outcome === 'ALREADY_CANCELED') {
      throw new BadRequestException({
        code: 'APPOINTMENT_ALREADY_CANCELED',
        title: 'Agendamento já cancelado',
        message: 'Este agendamento já foi cancelado anteriormente.',
        recommendedAction: 'Atualize a agenda antes de tentar uma nova ação.',
      });
    }

    if (outcome === 'ALREADY_NO_SHOW') {
      throw new BadRequestException({
        code: 'APPOINTMENT_ALREADY_NO_SHOW',
        title: 'Agendamento já marcado como falta',
        message: 'Este agendamento já está marcado como no-show.',
        recommendedAction: 'Atualize a agenda antes de tentar uma nova ação.',
      });
    }

    throw new BadRequestException({
      code: 'APPOINTMENT_INVALID_STATUS_TRANSITION',
      title: 'Transição de status inválida',
      message: 'Esta ação não é permitida para o status atual do agendamento.',
      recommendedAction: 'Atualize a agenda e revise o status antes de tentar novamente.',
    });
  }

  private assertUnitScope(entityLabel: string, entityUnitId: string | null | undefined, currentUnitId: string | null) {
    if (!currentUnitId) {
      return;
    }

    if (entityUnitId && entityUnitId !== currentUnitId) {
      throw new BadRequestException({
        code: 'APPOINTMENT_UNIT_SCOPE_MISMATCH',
        title: `${entityLabel} fora da unidade permitida`,
        message: `${entityLabel} não pertence à unidade operacional atual.`,
        recommendedAction: 'Selecione um registro da mesma unidade ou um registro global do tenant.',
      });
    }
  }

  private assertActiveStatus(entityLabel: string, status: string | null | undefined) {
    if (status && status !== 'ACTIVE') {
      throw new BadRequestException({
        code: 'APPOINTMENT_INACTIVE_REFERENCE',
        title: `${entityLabel} inativo`,
        message: `${entityLabel} está inativo e não pode ser usado neste agendamento.`,
        recommendedAction: `Selecione outro ${entityLabel.toLowerCase()} ou reative o cadastro antes de continuar.`,
      });
    }
  }

  findAllByTenant(tenantId: string) {
    return this.prisma.appointment.findMany({
      where: { tenantId },
      orderBy: { startAt: 'asc' },
    });
  }

  async create(
    tenantId: string,
    unitId: string | null,
    dto: CreateAppointmentDto,
    source: 'INTERNAL' | 'ONLINE_BOOKING' | 'MANUAL' = 'INTERNAL',
  ) {
    const clientId = dto.clientId?.trim();
    const serviceId = dto.serviceId?.trim();
    const professionalId = dto.professionalId?.trim() || undefined;
    const resourceId = dto.resourceId?.trim() || undefined;

    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);

    if (!clientId || !serviceId) {
      throw new BadRequestException({
        code: 'APPOINTMENT_REQUIRED_REFERENCES',
        title: 'Referências obrigatórias ausentes',
        message: 'Cliente e serviço são obrigatórios para criar um agendamento.',
        recommendedAction: 'Informe cliente e serviço válidos antes de tentar novamente.',
      });
    }

    if (endAt <= startAt) {
      throw new BadRequestException({
        code: 'APPOINTMENT_INVALID_RANGE',
        title: 'Intervalo inválido',
        message: 'O horário final precisa ser maior que o horário inicial.',
        recommendedAction: 'Revise o intervalo informado e tente novamente.',
      });
    }

    const client = await this.prisma.client.findFirst({
      where: {
        id: clientId,
        tenantId,
      },
    });

    if (!client) {
      throw new NotFoundException({
        code: 'CLIENT_NOT_FOUND',
        title: 'Cliente não encontrado',
        message: 'Não encontramos o cliente informado para este tenant.',
        recommendedAction: 'Revise o cliente selecionado e tente novamente.',
      });
    }

    this.assertUnitScope('Cliente', client.unitId, unitId);
    this.assertActiveStatus('Cliente', client.status);

    const service = await this.prisma.serviceCatalog.findFirst({
      where: {
        id: serviceId,
        tenantId,
      },
    });

    if (!service) {
      throw new NotFoundException({
        code: 'SERVICE_NOT_FOUND',
        title: 'Serviço não encontrado',
        message: 'Não encontramos o serviço informado para este tenant.',
        recommendedAction: 'Revise o serviço selecionado e tente novamente.',
      });
    }

    this.assertUnitScope('Serviço', service.unitId, unitId);
    this.assertActiveStatus('Serviço', service.status);

    if (service.requiresProfessional && !professionalId) {
      throw new BadRequestException({
        code: 'PROFESSIONAL_REQUIRED',
        title: 'Profissional obrigatório',
        message: 'Este serviço exige um profissional responsável no agendamento.',
        recommendedAction: 'Selecione um profissional válido antes de continuar.',
      });
    }

    if (professionalId) {
      const professional = await this.prisma.professional.findFirst({
        where: {
          id: professionalId,
          tenantId,
        },
      });

      if (!professional) {
        throw new NotFoundException({
          code: 'PROFESSIONAL_NOT_FOUND',
          title: 'Profissional não encontrado',
          message: 'Não encontramos o profissional informado para este tenant.',
          recommendedAction: 'Revise o profissional selecionado e tente novamente.',
        });
      }

      this.assertUnitScope('Profissional', professional.unitId, unitId);
      this.assertActiveStatus('Profissional', professional.status);
    }

    if (resourceId) {
      const resource = await this.prisma.operationalResource.findFirst({
        where: {
          id: resourceId,
          tenantId,
        },
      });

      if (!resource) {
        throw new NotFoundException({
          code: 'RESOURCE_NOT_FOUND',
          title: 'Recurso não encontrado',
          message: 'Não encontramos o recurso informado para este tenant.',
          recommendedAction: 'Revise o recurso selecionado e tente novamente.',
        });
      }

      this.assertUnitScope('Recurso', resource.unitId, unitId);
      this.assertActiveStatus('Recurso', resource.status);
    }

    if (!dto.isOverbook && professionalId) {
      const conflict = await this.prisma.appointment.findFirst({
        where: {
          tenantId,
          professionalId,
          status: { in: ['SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'IN_SERVICE'] },
          startAt: { lt: endAt },
          endAt: { gt: startAt },
        },
      });

      if (conflict) {
        throw new BadRequestException({
          code: 'APPOINTMENT_CONFLICT',
          title: 'Conflito de agenda',
          message: 'Já existe um atendimento neste intervalo para este profissional.',
          recommendedAction: 'Escolha outro horário, profissional ou utilize encaixe autorizado.',
        });
      }
    }

    if (resourceId) {
      const resourceBlocked = await this.prisma.appointmentBlock.findFirst({
        where: {
          tenantId,
          resourceId,
          active: true,
          startsAt: { lt: endAt },
          endsAt: { gt: startAt },
        },
      });

      if (resourceBlocked) {
        throw new BadRequestException({
          code: 'RESOURCE_BLOCKED',
          title: 'Recurso indisponível',
          message: 'O recurso está bloqueado no horário informado.',
          recommendedAction: 'Escolha outro horário ou outro recurso.',
        });
      }
    }

    return this.prisma.appointment.create({
      data: {
        tenantId,
        unitId,
        clientId,
        professionalId,
        serviceId,
        resourceId,
        startAt,
        endAt,
        isWalkIn: dto.isWalkIn ?? false,
        isOverbook: dto.isOverbook ?? false,
        notes: dto.notes,
        source,
      },
    });
  }

  /**
   * Atualiza horario/profissional/servico de um agendamento existente -
   * usado tanto pelo formulario de edicao quanto por "mover" no calendario
   * (mover e so uma edicao de startAt/endAt). Reaproveita as mesmas
   * validacoes de conflito do create(), excluindo o proprio agendamento.
   */
  async update(
    tenantId: string,
    unitId: string | null,
    appointmentId: string,
    dto: UpdateAppointmentDto,
  ) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, tenantId },
    });

    if (!appointment) {
      throw new NotFoundException({
        code: 'APPOINTMENT_NOT_FOUND',
        title: 'Agendamento não encontrado',
        message: 'Não encontramos o agendamento informado.',
        recommendedAction: 'Atualize a agenda e tente novamente.',
      });
    }

    if (LOCKED_APPOINTMENT_STATUSES.includes(appointment.status)) {
      throw new BadRequestException({
        code: 'APPOINTMENT_LOCKED_STATUS',
        title: 'Agendamento não pode ser editado',
        message: `Agendamentos com status ${appointment.status} não podem ser alterados.`,
        recommendedAction: 'Crie um novo agendamento se for necessário.',
      });
    }

    const clientId = dto.clientId?.trim() || appointment.clientId;
    const serviceId = dto.serviceId?.trim() || appointment.serviceId;
    const professionalId =
      dto.professionalId !== undefined ? dto.professionalId?.trim() || null : appointment.professionalId;
    const resourceId =
      dto.resourceId !== undefined ? dto.resourceId?.trim() || null : appointment.resourceId;
    const startAt = dto.startAt ? new Date(dto.startAt) : appointment.startAt;
    const endAt = dto.endAt ? new Date(dto.endAt) : appointment.endAt;
    const isOverbook = dto.isOverbook ?? appointment.isOverbook;

    if (endAt <= startAt) {
      throw new BadRequestException({
        code: 'APPOINTMENT_INVALID_RANGE',
        title: 'Intervalo inválido',
        message: 'O horário final precisa ser maior que o horário inicial.',
        recommendedAction: 'Revise o intervalo informado e tente novamente.',
      });
    }

    const client = await this.prisma.client.findFirst({ where: { id: clientId, tenantId } });
    if (!client) {
      throw new NotFoundException({
        code: 'CLIENT_NOT_FOUND',
        title: 'Cliente não encontrado',
        message: 'Não encontramos o cliente informado para este tenant.',
        recommendedAction: 'Revise o cliente selecionado e tente novamente.',
      });
    }
    this.assertUnitScope('Cliente', client.unitId, unitId);
    this.assertActiveStatus('Cliente', client.status);

    const service = await this.prisma.serviceCatalog.findFirst({ where: { id: serviceId, tenantId } });
    if (!service) {
      throw new NotFoundException({
        code: 'SERVICE_NOT_FOUND',
        title: 'Serviço não encontrado',
        message: 'Não encontramos o serviço informado para este tenant.',
        recommendedAction: 'Revise o serviço selecionado e tente novamente.',
      });
    }
    this.assertUnitScope('Serviço', service.unitId, unitId);
    this.assertActiveStatus('Serviço', service.status);

    if (service.requiresProfessional && !professionalId) {
      throw new BadRequestException({
        code: 'PROFESSIONAL_REQUIRED',
        title: 'Profissional obrigatório',
        message: 'Este serviço exige um profissional responsável no agendamento.',
        recommendedAction: 'Selecione um profissional válido antes de continuar.',
      });
    }

    if (professionalId) {
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
      this.assertUnitScope('Profissional', professional.unitId, unitId);
      this.assertActiveStatus('Profissional', professional.status);
    }

    if (resourceId) {
      const resource = await this.prisma.operationalResource.findFirst({
        where: { id: resourceId, tenantId },
      });
      if (!resource) {
        throw new NotFoundException({
          code: 'RESOURCE_NOT_FOUND',
          title: 'Recurso não encontrado',
          message: 'Não encontramos o recurso informado para este tenant.',
          recommendedAction: 'Revise o recurso selecionado e tente novamente.',
        });
      }
      this.assertUnitScope('Recurso', resource.unitId, unitId);
      this.assertActiveStatus('Recurso', resource.status);
    }

    if (!isOverbook && professionalId) {
      const conflict = await this.prisma.appointment.findFirst({
        where: {
          tenantId,
          professionalId,
          id: { not: appointmentId },
          status: { in: ACTIVE_APPOINTMENT_STATUSES },
          startAt: { lt: endAt },
          endAt: { gt: startAt },
        },
      });
      if (conflict) {
        throw new BadRequestException({
          code: 'APPOINTMENT_CONFLICT',
          title: 'Conflito de agenda',
          message: 'Já existe um atendimento neste intervalo para este profissional.',
          recommendedAction: 'Escolha outro horário, profissional ou utilize encaixe autorizado.',
        });
      }
    }

    if (resourceId) {
      const resourceBlocked = await this.prisma.appointmentBlock.findFirst({
        where: {
          tenantId,
          resourceId,
          active: true,
          startsAt: { lt: endAt },
          endsAt: { gt: startAt },
        },
      });
      if (resourceBlocked) {
        throw new BadRequestException({
          code: 'RESOURCE_BLOCKED',
          title: 'Recurso indisponível',
          message: 'O recurso está bloqueado no horário informado.',
          recommendedAction: 'Escolha outro horário ou outro recurso.',
        });
      }
    }

    return this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        clientId,
        serviceId,
        professionalId,
        resourceId,
        startAt,
        endAt,
        isOverbook,
        notes: dto.notes !== undefined ? dto.notes : appointment.notes,
      },
    });
  }

  async cancel(tenantId: string, appointmentId: string, dto: CancelAppointmentDto) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, tenantId },
    });

    if (!appointment) {
      throw new NotFoundException({
        code: 'APPOINTMENT_NOT_FOUND',
        title: 'Agendamento não encontrado',
        message: 'Não encontramos o agendamento informado.',
        recommendedAction: 'Atualize a agenda e tente novamente.',
      });
    }

    this.assertTransitionAllowed(appointment.status, 'cancel');

    return this.prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        status: 'CANCELED',
        canceledAt: new Date(),
        canceledReason: dto.reason,
      },
    });
  }

  async markNoShow(tenantId: string, appointmentId: string) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, tenantId },
    });

    if (!appointment) {
      throw new NotFoundException({
        code: 'APPOINTMENT_NOT_FOUND',
        title: 'Agendamento não encontrado',
        message: 'Não encontramos o agendamento informado.',
        recommendedAction: 'Atualize a agenda e tente novamente.',
      });
    }

    this.assertTransitionAllowed(appointment.status, 'markNoShow');

    return this.prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        status: 'NO_SHOW',
        noShowAt: new Date(),
      },
    });
  }
}