import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequiredPermissions } from '../../common/decorators/required-permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { AppointmentsService } from './appointments.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';

@Controller('v1/appointments')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionGuard)
export class AppointmentsController {
  constructor(
    private readonly appointmentsService: AppointmentsService,
    private readonly whatsAppService: WhatsAppService,
  ) {}

  @Get()
  @RequiredPermissions('appointments.read')
  findAll(@CurrentTenant() tenant: { id: string }) {
    return this.appointmentsService.findAllByTenant(tenant.id);
  }

  @Post()
  @RequiredPermissions('appointments.create')
  async create(
    @CurrentTenant() tenant: { id: string },
    @CurrentUser() user: { unitId?: string | null },
    @Body() dto: CreateAppointmentDto,
  ) {
    const appointment = await this.appointmentsService.create(tenant.id, user?.unitId ?? null, dto);
    this.whatsAppService
      .sendAppointmentConfirmation(tenant.id, user?.unitId ?? null, appointment.id)
      .catch(() => undefined);
    return appointment;
  }

  @Patch(':id')
  @RequiredPermissions('appointments.update')
  update(
    @CurrentTenant() tenant: { id: string },
    @CurrentUser() user: { unitId?: string | null },
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentDto,
  ) {
    return this.appointmentsService.update(tenant.id, user?.unitId ?? null, id, dto);
  }

  @Post(':id/cancel')
  @RequiredPermissions('appointments.cancel')
  cancel(
    @CurrentTenant() tenant: { id: string },
    @Param('id') id: string,
    @Body() dto: CancelAppointmentDto,
  ) {
    return this.appointmentsService.cancel(tenant.id, id, dto);
  }

  @Post(':id/no-show')
  @RequiredPermissions('appointments.no_show')
  noShow(
    @CurrentTenant() tenant: { id: string },
    @Param('id') id: string,
  ) {
    return this.appointmentsService.markNoShow(tenant.id, id);
  }
}
