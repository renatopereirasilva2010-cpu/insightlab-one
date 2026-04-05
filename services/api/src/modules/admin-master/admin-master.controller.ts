import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { RequiredPermissions } from '../../common/decorators/required-permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { AdminMasterService } from './admin-master.service';
import { CreateMigrationJobDto } from './dto/create-migration-job.dto';
import { ImportMigrationBatchDto } from './dto/import-migration-batch.dto';
import { ReconcileMigrationJobDto } from './dto/reconcile-migration-job.dto';

@Controller('v1/admin-master')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionGuard)
export class AdminMasterController {
  constructor(private readonly adminMasterService: AdminMasterService) {}

  @Get('migration-jobs')
  @RequiredPermissions('admin-master.read')
  findMigrationJobs(@CurrentTenant() tenant: { id: string }) {
    return this.adminMasterService.findMigrationJobsByTenant(tenant.id);
  }

  @Post('migration-jobs')
  @RequiredPermissions('admin-master.migration.create')
  createMigrationJob(
    @CurrentTenant() tenant: { id: string },
    @Body() dto: CreateMigrationJobDto,
  ) {
    return this.adminMasterService.createMigrationJob(tenant.id, dto);
  }

  @Post('migration-jobs/:id/import-batch')
  @RequiredPermissions('admin-master.migration.import')
  importBatch(
    @CurrentTenant() tenant: { id: string },
    @Param('id') id: string,
    @Body() dto: ImportMigrationBatchDto,
  ) {
    return this.adminMasterService.importBatch(tenant.id, id, dto);
  }

  @Post('migration-jobs/:id/reconcile')
  @RequiredPermissions('admin-master.migration.reconcile')
  reconcile(
    @CurrentTenant() tenant: { id: string },
    @Param('id') id: string,
    @Body() dto: ReconcileMigrationJobDto,
  ) {
    return this.adminMasterService.reconcileJob(tenant.id, id, dto);
  }
}
