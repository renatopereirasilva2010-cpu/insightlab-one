import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { RequiredPermissions } from '../../common/decorators/required-permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesService } from './roles.service';

@Controller('v1/roles')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @RequiredPermissions('roles.read')
  findAll(@CurrentTenant() tenant: { id: string }) {
    return this.rolesService.findAllByTenant(tenant.id);
  }
}
