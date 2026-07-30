import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
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
import { CreateProfessionalDto } from './dto/create-professional.dto';
import { UpdateProfessionalDto } from './dto/update-professional.dto';
import { ProfessionalsService } from './professionals.service';

@Controller('v1/professionals')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionGuard)
export class ProfessionalsController {
  constructor(private readonly professionalsService: ProfessionalsService) {}

  @Get()
  @RequiredPermissions('professionals.read')
  findAll(@CurrentTenant() tenant: { id: string }) {
    return this.professionalsService.findAllByTenant(tenant.id);
  }

  @Post()
  @RequiredPermissions('professionals.create')
  create(
    @CurrentTenant() tenant: { id: string },
    @CurrentUser() user: { unitId?: string | null },
    @Body() dto: CreateProfessionalDto,
  ) {
    return this.professionalsService.create(tenant.id, user?.unitId ?? null, dto);
  }

  @Patch(':id')
  @RequiredPermissions('professionals.update')
  update(
    @CurrentTenant() tenant: { id: string },
    @Param('id') id: string,
    @Body() dto: UpdateProfessionalDto,
  ) {
    return this.professionalsService.update(tenant.id, id, dto);
  }

  @Post(':id/photo')
  @RequiredPermissions('professionals.update')
  @UseInterceptors(createPhotoUploadInterceptor('professionals'))
  uploadPhoto(
    @CurrentTenant() tenant: { id: string },
    @Param('id') id: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.professionalsService.updatePhoto(tenant.id, id, file);
  }
}
