import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequiredPermissions } from '../../common/decorators/required-permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CashRegisterService } from './cash-register.service';
import { CloseCashRegisterDto } from './dto/close-cash-register.dto';
import { OpenCashRegisterDto } from './dto/open-cash-register.dto';

@Controller('v1/cash-register')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionGuard)
export class CashRegisterController {
  constructor(private readonly cashRegisterService: CashRegisterService) {}

  @Get()
  @RequiredPermissions('cash-register.read')
  findAll(@CurrentTenant() tenant: { id: string }) {
    return this.cashRegisterService.findAllByTenant(tenant.id);
  }

  @Post('open')
  @RequiredPermissions('cash-register.open')
  open(
    @CurrentTenant() tenant: { id: string },
    @CurrentUser() user: { unitId?: string | null },
    @Body() dto: OpenCashRegisterDto,
  ) {
    return this.cashRegisterService.open(tenant.id, user?.unitId ?? null, dto);
  }

  @Post(':id/close')
  @RequiredPermissions('cash-register.close')
  close(
    @CurrentTenant() tenant: { id: string },
    @Param('id') id: string,
    @Body() dto: CloseCashRegisterDto,
  ) {
    return this.cashRegisterService.close(tenant.id, id, dto);
  }
}
