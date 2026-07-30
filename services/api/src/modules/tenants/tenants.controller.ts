import {
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequiredPermissions } from '../../common/decorators/required-permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { createPhotoUploadInterceptor } from '../../common/upload/photo-upload.interceptor';
import { TenantsService } from './tenants.service';

@Controller('v1/tenants')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  @RequiredPermissions('tenants.read')
  findAll() {
    return this.tenantsService.findAll();
  }

  @Post(':id/logo')
  @RequiredPermissions('tenants.update')
  @UseInterceptors(createPhotoUploadInterceptor('tenants'))
  uploadLogo(
    @CurrentUser() user: { tenantId: string },
    @Param('id') id: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.tenantsService.updateLogo(user.tenantId, id, file);
  }
}
