import { Controller, Get, UseGuards } from '@nestjs/common';
import { RequiredPermissions } from '../../common/decorators/required-permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { PermissionsService } from './permissions.service';

@Controller('v1/permissions')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @RequiredPermissions('roles.read')
  findAll() {
    return this.permissionsService.findAll();
  }
}
