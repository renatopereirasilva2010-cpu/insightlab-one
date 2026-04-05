import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequiredPermissions } from '../../common/decorators/required-permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CreateProfessionalDto } from './dto/create-professional.dto';
import { ProfessionalsService } from './professionals.service';

@Controller('v1/professionals')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionGuard)
export class ProfessionalsController {
  constructor(private readonly professionalsService: ProfessionalsService) {}

  @Get()
  @RequiredPermissions('professionals.read')
  findAll(@CurrentTenant() tenant: { id: string }) {
    return this.professionalsService.findAllByTenant(tenant.id);
  }

  @Post()
  @RequiredPermissions('professionals.create')
  create(
    @CurrentTenant() tenant: { id: string },
    @CurrentUser() user: { unitId?: string | null },
    @Body() dto: CreateProfessionalDto,
  ) {
    return this.professionalsService.create(tenant.id, user?.unitId ?? null, dto);
  }
}
