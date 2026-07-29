import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { RequiredPermissions } from '../../common/decorators/required-permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { WhatsAppService } from './whatsapp.service';

@Controller('v1/whatsapp/messages')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionGuard)
export class WhatsAppController {
  constructor(private readonly whatsAppService: WhatsAppService) {}

  @Get()
  @RequiredPermissions('whatsapp.read')
  findAll(@CurrentTenant() tenant: { id: string }) {
    return this.whatsAppService.findAllByTenant(tenant.id);
  }

  @Post(':id/resend')
  @RequiredPermissions('whatsapp.resend')
  resend(@CurrentTenant() tenant: { id: string }, @Param('id') id: string) {
    return this.whatsAppService.resend(tenant.id, id);
  }
}
