import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequiredPermissions } from '../../common/decorators/required-permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { BlockCommissionDto } from './dto/block-commission.dto';
import { CancelCommissionDto } from './dto/cancel-commission.dto';
import { GenerateCommissionDto } from './dto/generate-commission.dto';
import { ReleaseCommissionDto } from './dto/release-commission.dto';
import { CommissionsService } from './commissions.service';

@Controller('v1/commissions')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionGuard)
export class CommissionsController {
  constructor(private readonly commissionsService: CommissionsService) {}

  @Get()
  @RequiredPermissions('commissions.read')
  findAll(@CurrentTenant() tenant: { id: string }) {
    return this.commissionsService.findAllByTenant(tenant.id);
  }

  @Post('generate')
  @RequiredPermissions('commissions.generate')
  generate(
    @CurrentTenant() tenant: { id: string },
    @CurrentUser() user: { unitId?: string | null },
    @Body() dto: GenerateCommissionDto,
  ) {
    return this.commissionsService.generate(tenant.id, user?.unitId ?? null, dto);
  }

  @Post(':id/release')
  @RequiredPermissions('commissions.release')
  release(
    @CurrentTenant() tenant: { id: string },
    @Param('id') id: string,
    @Body() dto: ReleaseCommissionDto,
  ) {
    return this.commissionsService.release(tenant.id, id, dto);
  }

  @Post(':id/block')
  @RequiredPermissions('commissions.block')
  block(
    @CurrentTenant() tenant: { id: string },
    @Param('id') id: string,
    @Body() dto: BlockCommissionDto,
  ) {
    return this.commissionsService.block(tenant.id, id, dto);
  }

  @Post(':id/cancel')
  @RequiredPermissions('commissions.cancel')
  cancel(
    @CurrentTenant() tenant: { id: string },
    @Param('id') id: string,
    @Body() dto: CancelCommissionDto,
  ) {
    return this.commissionsService.cancel(tenant.id, id, dto);
  }
}
