import { Controller, Get, UseGuards } from '@nestjs/common';
import { RequiredPermissions } from '../../common/decorators/required-permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { TenantsService } from './tenants.service';

@Controller('v1/tenants')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  @RequiredPermissions('tenants.read')
  findAll() {
    return this.tenantsService.findAll();
  }
}
