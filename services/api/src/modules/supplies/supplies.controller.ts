import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequiredPermissions } from '../../common/decorators/required-permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CreateSupplyDto } from './dto/create-supply.dto';
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

  @Post()
  @RequiredPermissions('supplies.create')
  create(
    @CurrentTenant() tenant: { id: string },
    @CurrentUser() user: { unitId?: string | null },
    @Body() dto: CreateSupplyDto,
  ) {
    return this.suppliesService.create(tenant.id, user?.unitId ?? null, dto);
  }
}
