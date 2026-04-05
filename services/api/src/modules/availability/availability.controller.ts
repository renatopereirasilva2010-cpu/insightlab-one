import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequiredPermissions } from '../../common/decorators/required-permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { QueryAvailabilityDto } from './dto/query-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { AvailabilityService } from './availability.service';

@Controller('v1/availability')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionGuard)
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Get()
  @RequiredPermissions('availability.read')
  query(
    @CurrentTenant() tenant: { id: string },
    @Query() dto: QueryAvailabilityDto,
  ) {
    return this.availabilityService.query(tenant.id, dto);
  }

  @Post()
  @RequiredPermissions('availability.create')
  create(
    @CurrentTenant() tenant: { id: string },
    @CurrentUser() user: { unitId?: string | null },
    @Body() dto: CreateAvailabilityDto,
  ) {
    return this.availabilityService.create(tenant.id, user?.unitId ?? null, dto);
  }

  @Patch(':id')
  @RequiredPermissions('availability.update')
  update(
    @CurrentTenant() tenant: { id: string },
    @Param('id') id: string,
    @Body() dto: UpdateAvailabilityDto,
  ) {
    return this.availabilityService.update(tenant.id, id, dto);
  }
}