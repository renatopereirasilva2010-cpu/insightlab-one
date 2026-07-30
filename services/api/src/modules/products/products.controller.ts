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
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@Controller('v1/products')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @RequiredPermissions('products.read')
  findAll(@CurrentTenant() tenant: { id: string }) {
    return this.productsService.findAllByTenant(tenant.id);
  }

  @Post()
  @RequiredPermissions('products.create')
  create(
    @CurrentTenant() tenant: { id: string },
    @CurrentUser() user: { unitId?: string | null },
    @Body() dto: CreateProductDto,
  ) {
    return this.productsService.create(tenant.id, user?.unitId ?? null, dto);
  }

  @Patch(':id')
  @RequiredPermissions('products.update')
  update(
    @CurrentTenant() tenant: { id: string },
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(tenant.id, id, dto);
  }

  @Post(':id/photo')
  @RequiredPermissions('products.update')
  @UseInterceptors(createPhotoUploadInterceptor('products'))
  uploadPhoto(
    @CurrentTenant() tenant: { id: string },
    @Param('id') id: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.productsService.updatePhoto(tenant.id, id, file);
  }
}
