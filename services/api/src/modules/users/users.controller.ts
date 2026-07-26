import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { RequiredPermissions } from '../../common/decorators/required-permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@Controller('v1/users')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequiredPermissions('users.read')
  findAll(@CurrentTenant() tenant: { id: string }) {
    return this.usersService.findAllByTenant(tenant.id);
  }

  @Post()
  @RequiredPermissions('users.create')
  create(@CurrentTenant() tenant: { id: string }, @Body() dto: CreateUserDto) {
    return this.usersService.create(tenant.id, dto);
  }

  @Patch(':id')
  @RequiredPermissions('users.update')
  update(
    @CurrentTenant() tenant: { id: string },
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(tenant.id, id, dto);
  }

  @Post(':id/block')
  @RequiredPermissions('users.block')
  block(@CurrentTenant() tenant: { id: string }, @Param('id') id: string) {
    return this.usersService.block(tenant.id, id);
  }
}
