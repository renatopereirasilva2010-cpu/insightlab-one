import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { RequiredPermissions } from '../../common/decorators/required-permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { createSpreadsheetUploadInterceptor } from '../../common/upload/spreadsheet-upload.interceptor';
import { AdminMasterService } from './admin-master.service';
import { ClientImportService } from './client-import.service';
import { CreateMigrationJobDto } from './dto/create-migration-job.dto';
import { ImportMigrationBatchDto } from './dto/import-migration-batch.dto';
import { ReconcileMigrationJobDto } from './dto/reconcile-migration-job.dto';
import { AnalyzeClientImportDto } from './dto/analyze-client-import.dto';
import { CommitClientImportDto } from './dto/commit-client-import.dto';

@Controller('v1/admin-master')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionGuard)
export class AdminMasterController {
  constructor(
    private readonly adminMasterService: AdminMasterService,
    private readonly clientImportService: ClientImportService,
  ) {}

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

  @Post('migration-jobs/:id/analyze')
  @RequiredPermissions('admin-master.migration.import')
  @UseInterceptors(createSpreadsheetUploadInterceptor())
  analyzeClientImport(
    @CurrentTenant() tenant: { id: string },
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: AnalyzeClientImportDto,
  ) {
    return this.clientImportService.analyze(tenant.id, id, file, dto);
  }

  @Post('migration-jobs/:id/commit')
  @RequiredPermissions('admin-master.migration.import')
  commitClientImport(
    @CurrentTenant() tenant: { id: string },
    @Param('id') id: string,
    @Body() dto: CommitClientImportDto,
  ) {
    return this.clientImportService.commit(tenant.id, id, dto);
  }
}
