import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { CancelAttendanceDto } from './dto/cancel-attendance.dto';

@Injectable()
export class AttendancesService {
  constructor(private readonly prisma: PrismaService) {}

  findAllByTenant(tenantId: string) {
    return this.prisma.attendance.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(tenantId: string, unitId: string | null, dto: CreateAttendanceDto) {
    if (dto.appointmentId) {
      const existing = await this.prisma.attendance.findFirst({
        where: { tenantId, appointmentId: dto.appointmentId },
      });

      if (existing) {
        throw new BadRequestException({
          code: 'ATTENDANCE_ALREADY_EXISTS',
          title: 'Atendimento já existente',
          message: 'Já existe um atendimento vinculado a este agendamento.',
          recommendedAction: 'Atualize a tela antes de tentar novamente.',
        });
      }
    }

    return this.prisma.attendance.create({
      data: {
        tenantId,
        unitId,
        appointmentId: dto.appointmentId,
        clientId: dto.clientId,
        professionalId: dto.professionalId,
        serviceId: dto.serviceId,
        notes: dto.notes,
      },
    });
  }

  async start(tenantId: string, attendanceId: string) {
    const attendance = await this.prisma.attendance.findFirst({
      where: { id: attendanceId, tenantId },
    });

    if (!attendance) {
      throw new NotFoundException({
        code: 'ATTENDANCE_NOT_FOUND',
        title: 'Atendimento não encontrado',
        message: 'Não encontramos o atendimento informado.',
        recommendedAction: 'Atualize a tela e tente novamente.',
      });
    }

    if (attendance.status !== 'OPEN') {
      throw new BadRequestException({
        code: 'ATTENDANCE_INVALID_START',
        title: 'Início inválido',
        message: 'Somente atendimentos abertos podem ser iniciados.',
        recommendedAction: 'Revise o status atual antes de tentar novamente.',
      });
    }

    return this.prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      },
    });
  }

  async markInProgress(tenantId: string, attendanceId: string) {
    return this.start(tenantId, attendanceId);
  }

  async finish(tenantId: string, attendanceId: string) {
    const attendance = await this.prisma.attendance.findFirst({
      where: { id: attendanceId, tenantId },
    });

    if (!attendance) {
      throw new NotFoundException({
        code: 'ATTENDANCE_NOT_FOUND',
        title: 'Atendimento não encontrado',
        message: 'Não encontramos o atendimento informado.',
        recommendedAction: 'Atualize a tela e tente novamente.',
      });
    }

    if (attendance.status === 'CANCELED') {
      throw new BadRequestException({
        code: 'ATTENDANCE_ALREADY_CANCELED',
        title: 'Atendimento cancelado',
        message: 'Não é possível finalizar um atendimento cancelado.',
        recommendedAction: 'Revise o histórico antes de tentar novamente.',
      });
    }

    if (attendance.status !== 'IN_PROGRESS') {
      throw new BadRequestException({
        code: 'ATTENDANCE_INVALID_FINISH',
        title: 'Finalização inválida',
        message: 'Somente atendimentos em andamento podem ser finalizados.',
        recommendedAction: 'Inicie o atendimento antes de finalizar.',
      });
    }

    return this.prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        status: 'FINISHED',
        finishedAt: new Date(),
      },
    });
  }

  async cancel(tenantId: string, attendanceId: string, dto: CancelAttendanceDto) {
    const attendance = await this.prisma.attendance.findFirst({
      where: { id: attendanceId, tenantId },
    });

    if (!attendance) {
      throw new NotFoundException({
        code: 'ATTENDANCE_NOT_FOUND',
        title: 'Atendimento não encontrado',
        message: 'Não encontramos o atendimento informado.',
        recommendedAction: 'Atualize a tela e tente novamente.',
      });
    }

    if (attendance.status === 'FINISHED') {
      throw new BadRequestException({
        code: 'ATTENDANCE_ALREADY_FINISHED',
        title: 'Atendimento já finalizado',
        message: 'Não é possível cancelar um atendimento já finalizado.',
        recommendedAction: 'Revise o histórico antes de tentar novamente.',
      });
    }

    if (attendance.status === 'CANCELED') {
      throw new BadRequestException({
        code: 'ATTENDANCE_ALREADY_CANCELED',
        title: 'Atendimento já cancelado',
        message: 'Este atendimento já foi cancelado anteriormente.',
        recommendedAction: 'Atualize a tela antes de tentar uma nova ação.',
      });
    }

    return this.prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        status: 'CANCELED',
        notes: dto.reason ? `${attendance.notes ?? ''}\n[CANCELAMENTO] ${dto.reason}`.trim() : attendance.notes,
      },
    });
  }
}
