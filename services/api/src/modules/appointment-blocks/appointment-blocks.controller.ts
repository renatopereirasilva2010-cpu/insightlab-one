import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequiredPermissions } from '../../common/decorators/required-permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CreateAppointmentBlockDto } from './dto/create-appointment-block.dto';
import { AppointmentBlocksService } from './appointment-blocks.service';

@Controller('v1/appointment-blocks')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionGuard)
export class AppointmentBlocksController {
  constructor(private readonly appointmentBlocksService: AppointmentBlocksService) {}

  @Get()
  @RequiredPermissions('appointments.read')
  findAll(@CurrentTenant() tenant: { id: string }) {
    return this.appointmentBlocksService.findAllByTenant(tenant.id);
  }

  @Post()
  @RequiredPermissions('appointments.block')
  create(
    @CurrentTenant() tenant: { id: string },
    @CurrentUser() user: { unitId?: string | null },
    @Body() dto: CreateAppointmentBlockDto,
  ) {
    return this.appointmentBlocksService.create(tenant.id, user?.unitId ?? null, dto);
  }
}
