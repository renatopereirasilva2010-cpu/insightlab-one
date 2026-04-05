import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequiredPermissions } from '../../common/decorators/required-permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CreateClientDto } from './dto/create-client.dto';
import { ClientsService } from './clients.service';

@Controller('v1/clients')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  @RequiredPermissions('clients.read')
  findAll(@CurrentTenant() tenant: { id: string }) {
    return this.clientsService.findAllByTenant(tenant.id);
  }

  @Post()
  @RequiredPermissions('clients.create')
  create(
    @CurrentTenant() tenant: { id: string },
    @CurrentUser() user: { unitId?: string | null },
    @Body() dto: CreateClientDto,
  ) {
    return this.clientsService.create(tenant.id, user?.unitId ?? null, dto);
  }
}
