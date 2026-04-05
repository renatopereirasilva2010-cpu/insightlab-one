import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { RequiredPermissions } from '../../common/decorators/required-permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { UnitsService } from './units.service';
import { UpdateUnitFiscalDto } from './dto/update-unit-fiscal.dto';

@Controller('v1/units')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionGuard)
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Get()
  @RequiredPermissions('units.read')
  findAll(@CurrentTenant() tenant: { id: string }) {
    return this.unitsService.findAllByTenant(tenant.id);
  }

  @Patch(':id/fiscal')
  @RequiredPermissions('units.update')
  updateFiscal(
    @CurrentTenant() tenant: { id: string },
    @Param('id') id: string,
    @Body() dto: UpdateUnitFiscalDto,
  ) {
    return this.unitsService.updateFiscal(tenant.id, id, dto);
  }
}