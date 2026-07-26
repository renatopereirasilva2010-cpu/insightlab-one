import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequiredPermissions } from '../../common/decorators/required-permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { UpdateServiceFiscalDto } from './dto/update-service-fiscal.dto';
import { ServicesCatalogService } from './services-catalog.service';

@Controller('v1/services-catalog')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionGuard)
export class ServicesCatalogController {
  constructor(private readonly servicesCatalogService: ServicesCatalogService) {}

  @Get()
  @RequiredPermissions('services.read')
  findAll(@CurrentTenant() tenant: { id: string }) {
    return this.servicesCatalogService.findAllByTenant(tenant.id);
  }

  @Post()
  @RequiredPermissions('services.create')
  create(
    @CurrentTenant() tenant: { id: string },
    @CurrentUser() user: { unitId?: string | null },
    @Body() dto: CreateServiceDto,
  ) {
    return this.servicesCatalogService.create(tenant.id, user?.unitId ?? null, dto);
  }

  @Patch(':id')
  @RequiredPermissions('services.update')
  update(
    @CurrentTenant() tenant: { id: string },
    @Param('id') id: string,
    @Body() dto: UpdateServiceDto,
  ) {
    return this.servicesCatalogService.update(tenant.id, id, dto);
  }

  @Patch(':id/fiscal')
  @RequiredPermissions('services.update')
  updateFiscal(
    @CurrentTenant() tenant: { id: string },
    @Param('id') id: string,
    @Body() dto: UpdateServiceFiscalDto,
  ) {
    return this.servicesCatalogService.updateFiscal(tenant.id, id, dto);
  }
}