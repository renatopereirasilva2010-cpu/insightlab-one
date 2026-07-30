import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentTenant } from '../decorators/current-tenant.decorator';
import { RequiredPermissions } from '../decorators/required-permissions.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PermissionGuard } from '../guards/permission.guard';
import { TenantGuard } from '../guards/tenant.guard';
import { QueryAuditLogDto } from './dto/query-audit-log.dto';
import { AuditLogService } from './audit-log.service';

@Controller('v1/audit-logs')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionGuard)
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @RequiredPermissions('audit.read')
  query(@CurrentTenant() tenant: { id: string }, @Query() dto: QueryAuditLogDto) {
    return this.auditLogService.query(tenant.id, dto);
  }
}
