import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { RequiredPermissions } from '../../common/decorators/required-permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CreateUnitConversionDto } from './dto/create-unit-conversion.dto';
import { UnitConversionsService } from './unit-conversions.service';

@Controller('v1/unit-conversions')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionGuard)
export class UnitConversionsController {
  constructor(private readonly unitConversionsService: UnitConversionsService) {}

  @Get()
  @RequiredPermissions('unit-conversions.read')
  findAll(@CurrentTenant() tenant: { id: string }) {
    return this.unitConversionsService.findAllByTenant(tenant.id);
  }

  @Post()
  @RequiredPermissions('unit-conversions.create')
  create(
    @CurrentTenant() tenant: { id: string },
    @Body() dto: CreateUnitConversionDto,
  ) {
    return this.unitConversionsService.create(tenant.id, dto);
  }
}
