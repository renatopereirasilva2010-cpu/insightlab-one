import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequiredPermissions } from '../../common/decorators/required-permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CreateResourceDto } from './dto/create-resource.dto';
import { ResourcesService } from './resources.service';

@Controller('v1/resources')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionGuard)
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Get()
  @RequiredPermissions('resources.read')
  findAll(@CurrentTenant() tenant: { id: string }) {
    return this.resourcesService.findAllByTenant(tenant.id);
  }

  @Post()
  @RequiredPermissions('resources.create')
  create(
    @CurrentTenant() tenant: { id: string },
    @CurrentUser() user: { unitId?: string | null },
    @Body() dto: CreateResourceDto,
  ) {
    return this.resourcesService.create(tenant.id, user?.unitId ?? null, dto);
  }
}
