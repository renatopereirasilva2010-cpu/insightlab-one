import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { RequiredPermissions } from '../../common/decorators/required-permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { BusinessSettingsService } from './business-settings.service';

@Controller('v1/business-settings')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionGuard)
export class BusinessSettingsController {
  constructor(private readonly businessSettingsService: BusinessSettingsService) {}

  @Get()
  @RequiredPermissions('settings.read')
  getSettings(@CurrentTenant() tenant: { id: string }) {
    return this.businessSettingsService.getSettings(tenant.id);
  }
}
