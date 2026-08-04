import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequiredPermissions } from '../../common/decorators/required-permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { createPhotoUploadInterceptor } from '../../common/upload/photo-upload.interceptor';
import { CreateClientDto } from './dto/create-client.dto';
import { QueryClientsDto } from './dto/query-clients.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ClientsService } from './clients.service';

@Controller('v1/clients')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  @RequiredPermissions('clients.read')
  findAll(@CurrentTenant() tenant: { id: string }, @Query() query: QueryClientsDto) {
    return this.clientsService.findAllByTenant(tenant.id, query);
  }

  @Post()
  @RequiredPermissions('clients.create')
  create(
    @CurrentTenant() tenant: { id: string },
    @CurrentUser() user: { unitId?: string | null },
    @Body() dto: CreateClientDto,
  ) {
    return this.clientsService.create(tenant.id, user?.unitId ?? null, dto);
  }

  @Patch(':id')
  @RequiredPermissions('clients.update')
  update(
    @CurrentTenant() tenant: { id: string },
    @Param('id') id: string,
    @Body() dto: UpdateClientDto,
  ) {
    return this.clientsService.update(tenant.id, id, dto);
  }

  @Post(':id/photo')
  @RequiredPermissions('clients.update')
  @UseInterceptors(createPhotoUploadInterceptor('clients'))
  uploadPhoto(
    @CurrentTenant() tenant: { id: string },
    @Param('id') id: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.clientsService.updatePhoto(tenant.id, id, file);
  }

  @Get(':id/delete-impact')
  @RequiredPermissions('clients.delete')
  getDeleteImpact(@CurrentTenant() tenant: { id: string }, @Param('id') id: string) {
    return this.clientsService.getDeleteImpact(tenant.id, id);
  }

  @Delete(':id')
  @RequiredPermissions('clients.delete')
  remove(
    @CurrentTenant() tenant: { id: string },
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
  ) {
    return this.clientsService.remove(tenant.id, id, user.id);
  }
}
