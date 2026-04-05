import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequiredPermissions } from '../../common/decorators/required-permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CancelAttendanceDto } from './dto/cancel-attendance.dto';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { AttendancesService } from './attendances.service';

@Controller('v1/attendances')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionGuard)
export class AttendancesController {
  constructor(private readonly attendancesService: AttendancesService) {}

  @Get()
  @RequiredPermissions('attendances.read')
  findAll(@CurrentTenant() tenant: { id: string }) {
    return this.attendancesService.findAllByTenant(tenant.id);
  }

  @Post()
  @RequiredPermissions('attendances.create')
  create(
    @CurrentTenant() tenant: { id: string },
    @CurrentUser() user: { unitId?: string | null },
    @Body() dto: CreateAttendanceDto,
  ) {
    return this.attendancesService.create(tenant.id, user?.unitId ?? null, dto);
  }

  @Post(':id/start')
  @RequiredPermissions('attendances.start')
  start(@CurrentTenant() tenant: { id: string }, @Param('id') id: string) {
    return this.attendancesService.start(tenant.id, id);
  }

  @Post(':id/in-progress')
  @RequiredPermissions('attendances.start')
  inProgress(@CurrentTenant() tenant: { id: string }, @Param('id') id: string) {
    return this.attendancesService.markInProgress(tenant.id, id);
  }

  @Post(':id/finish')
  @RequiredPermissions('attendances.finish')
  finish(@CurrentTenant() tenant: { id: string }, @Param('id') id: string) {
    return this.attendancesService.finish(tenant.id, id);
  }

  @Post(':id/cancel')
  @RequiredPermissions('attendances.cancel')
  cancel(
    @CurrentTenant() tenant: { id: string },
    @Param('id') id: string,
    @Body() dto: CancelAttendanceDto,
  ) {
    return this.attendancesService.cancel(tenant.id, id, dto);
  }
}
