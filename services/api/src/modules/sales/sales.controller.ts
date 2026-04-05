import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequiredPermissions } from '../../common/decorators/required-permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CreateSaleItemDto } from '../sale-items/dto/create-sale-item.dto';
import { CreateSaleDto } from './dto/create-sale.dto';
import { SalesService } from './sales.service';

@Controller('v1/sales')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get()
  @RequiredPermissions('sales.read')
  findAll(@CurrentTenant() tenant: { id: string }) {
    return this.salesService.findAllByTenant(tenant.id);
  }

  @Post()
  @RequiredPermissions('sales.create')
  create(
    @CurrentTenant() tenant: { id: string },
    @CurrentUser() user: { unitId?: string | null },
    @Body() dto: CreateSaleDto,
  ) {
    return this.salesService.create(tenant.id, user?.unitId ?? null, dto);
  }

  @Post(':id/items')
  @RequiredPermissions('sales.update')
  addItem(
    @CurrentTenant() tenant: { id: string },
    @CurrentUser() user: { unitId?: string | null },
    @Param('id') id: string,
    @Body() dto: CreateSaleItemDto,
  ) {
    return this.salesService.addItem(tenant.id, user?.unitId ?? null, id, dto);
  }

  @Post(':id/recalculate')
  @RequiredPermissions('sales.update')
  recalculate(@CurrentTenant() tenant: { id: string }, @Param('id') id: string) {
    return this.salesService.recalculate(tenant.id, id);
  }

  @Post(':id/ready-for-checkout')
  @RequiredPermissions('sales.checkout')
  readyForCheckout(@CurrentTenant() tenant: { id: string }, @Param('id') id: string) {
    return this.salesService.readyForCheckout(tenant.id, id);
  }

  @Post(':id/cancel')
  @RequiredPermissions('sales.cancel')
  cancel(@CurrentTenant() tenant: { id: string }, @Param('id') id: string) {
    return this.salesService.cancel(tenant.id, id);
  }
}
