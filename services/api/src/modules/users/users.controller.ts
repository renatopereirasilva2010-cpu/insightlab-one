import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { RequiredPermissions } from '../../common/decorators/required-permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { UsersService } from './users.service';

@Controller('v1/users')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequiredPermissions('users.read')
  findAll(@CurrentTenant() tenant: { id: string }) {
    return this.usersService.findAllByTenant(tenant.id);
  }
}
