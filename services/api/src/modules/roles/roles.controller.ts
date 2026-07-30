import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { RequiredPermissions } from '../../common/decorators/required-permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { AssignPermissionDto } from './dto/assign-permission.dto';
import { AssignUserDto } from './dto/assign-user.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { RolesService } from './roles.service';

@Controller('v1/roles')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @RequiredPermissions('roles.read')
  findAll(@CurrentTenant() tenant: { id: string }) {
    return this.rolesService.findAllByTenant(tenant.id);
  }

  @Post()
  @RequiredPermissions('roles.assign')
  create(@CurrentTenant() tenant: { id: string }, @Body() dto: CreateRoleDto) {
    return this.rolesService.create(tenant.id, dto);
  }

  @Post(':id/permissions')
  @RequiredPermissions('roles.assign')
  assignPermission(
    @CurrentTenant() tenant: { id: string },
    @Param('id') id: string,
    @Body() dto: AssignPermissionDto,
  ) {
    return this.rolesService.assignPermission(tenant.id, id, dto);
  }

  @Post(':id/users')
  @RequiredPermissions('roles.assign')
  assignUser(
    @CurrentTenant() tenant: { id: string },
    @Param('id') id: string,
    @Body() dto: AssignUserDto,
  ) {
    return this.rolesService.assignUser(tenant.id, id, dto);
  }

  // Escopado pra reports.manage (Gerente) - so aceita codigos "reports.*",
  // verificado no service. roles.assign (Admin) continua usando o endpoint
  // generico acima pra qualquer outra permissao.
  @Post(':id/report-permissions')
  @RequiredPermissions('reports.manage')
  assignReportPermission(
    @CurrentTenant() tenant: { id: string },
    @Param('id') id: string,
    @Body() dto: AssignPermissionDto,
  ) {
    return this.rolesService.assignReportPermission(tenant.id, id, dto);
  }

  @Delete(':id/report-permissions/:code')
  @RequiredPermissions('reports.manage')
  revokeReportPermission(
    @CurrentTenant() tenant: { id: string },
    @Param('id') id: string,
    @Param('code') code: string,
  ) {
    return this.rolesService.revokeReportPermission(tenant.id, id, code);
  }
}
