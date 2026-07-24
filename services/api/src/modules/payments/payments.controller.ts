import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequiredPermissions } from '../../common/decorators/required-permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { MarkFailedPaymentDto } from './dto/mark-failed-payment.dto';
import { PaymentsService } from './payments.service';

@Controller('v1/payments')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @RequiredPermissions('payments.read')
  findAll(@CurrentTenant() tenant: { id: string }) {
    return this.paymentsService.findAllByTenant(tenant.id);
  }

  @Post()
  @RequiredPermissions('payments.create')
  create(
    @CurrentTenant() tenant: { id: string },
    @CurrentUser() user: { unitId?: string | null },
    @Body() dto: CreatePaymentDto,
  ) {
    return this.paymentsService.create(tenant.id, user?.unitId ?? null, dto);
  }

  @Post(':id/mark-paid')
  @RequiredPermissions('payments.receive')
  markPaid(@CurrentTenant() tenant: { id: string }, @Param('id') id: string) {
    return this.paymentsService.markPaid(tenant.id, id);
  }

  @Post(':id/mark-failed')
  @RequiredPermissions('payments.update-status')
  markFailed(
    @CurrentTenant() tenant: { id: string },
    @Param('id') id: string,
    @Body() dto: MarkFailedPaymentDto,
  ) {
    return this.paymentsService.markFailed(tenant.id, id, dto);
  }

  @Post(':id/cancel')
  @RequiredPermissions('payments.update-status')
  cancel(@CurrentTenant() tenant: { id: string }, @Param('id') id: string) {
    return this.paymentsService.cancel(tenant.id, id);
  }
}
