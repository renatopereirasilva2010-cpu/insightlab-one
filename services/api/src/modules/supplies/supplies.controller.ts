import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequiredPermissions } from '../../common/decorators/required-permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CreateSupplyDto } from './dto/create-supply.dto';
import { UpdateSupplyDto } from './dto/update-supply.dto';
import { CreateSupplyMovementDto } from './dto/create-supply-movement.dto';
import { SuppliesService } from './supplies.service';

@Controller('v1/supplies')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionGuard)
export class SuppliesController {
  constructor(private readonly suppliesService: SuppliesService) {}

  @Get()
  @RequiredPermissions('supplies.read')
  findAll(@CurrentTenant() tenant: { id: string }) {
    return this.suppliesService.findAllByTenant(tenant.id);
  }

  @Get('low-stock')
  @RequiredPermissions('supplies.read')
  findLowStock(@CurrentTenant() tenant: { id: string }) {
    return this.suppliesService.findLowStock(tenant.id);
  }

  @Post()
  @RequiredPermissions('supplies.create')
  create(
    @CurrentTenant() tenant: { id: string },
    @CurrentUser() user: { unitId?: string | null },
    @Body() dto: CreateSupplyDto,
  ) {
    return this.suppliesService.create(tenant.id, user?.unitId ?? null, dto);
  }

  @Patch(':id')
  @RequiredPermissions('supplies.update')
  update(
    @CurrentTenant() tenant: { id: string },
    @Param('id') id: string,
    @Body() dto: UpdateSupplyDto,
  ) {
    return this.suppliesService.update(tenant.id, id, dto);
  }

  @Get(':id/movements')
  @RequiredPermissions('supplies.movements.read')
  findMovements(@CurrentTenant() tenant: { id: string }, @Param('id') id: string) {
    return this.suppliesService.findMovements(tenant.id, id);
  }

  @Post(':id/movements')
  @RequiredPermissions('supplies.movements.create')
  registerMovement(
    @CurrentTenant() tenant: { id: string },
    @CurrentUser() user: { id: string; unitId?: string | null },
    @Param('id') id: string,
    @Body() dto: CreateSupplyMovementDto,
  ) {
    return this.suppliesService.registerMovement(tenant.id, user?.unitId ?? null, user?.id ?? null, id, dto);
  }
}
