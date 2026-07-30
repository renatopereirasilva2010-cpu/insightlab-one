import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { buildPhotoUrl } from '../../common/upload/photo-upload.interceptor';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  findAllByTenant(tenantId: string) {
    return this.prisma.product.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(tenantId: string, unitId: string | null, dto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        tenantId,
        unitId,
        name: dto.name,
        sku: dto.sku,
        salePrice: dto.salePrice,
        cost: dto.cost,
      },
    });
  }

  async update(tenantId: string, productId: string, dto: UpdateProductDto) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, tenantId },
    });

    if (!product) {
      throw new NotFoundException({
        code: 'PRODUCT_NOT_FOUND',
        title: 'Produto não encontrado',
        message: 'Não encontramos o produto informado para este tenant.',
        recommendedAction: 'Revise o produto selecionado e tente novamente.',
      });
    }

    return this.prisma.product.update({
      where: { id: product.id },
      data: {
        name: dto.name,
        sku: dto.sku,
        salePrice: dto.salePrice,
        cost: dto.cost,
        stockQuantity: dto.stockQuantity,
        minStock: dto.minStock,
        status: dto.status,
      },
    });
  }

  async updatePhoto(tenantId: string, productId: string, file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException({
        code: 'PHOTO_REQUIRED',
        title: 'Foto obrigatória',
        message: 'Envie uma imagem PNG, JPEG ou WEBP de até 3MB.',
        recommendedAction: 'Selecione um arquivo válido e tente novamente.',
      });
    }

    const product = await this.prisma.product.findFirst({
      where: { id: productId, tenantId },
    });

    if (!product) {
      throw new NotFoundException({
        code: 'PRODUCT_NOT_FOUND',
        title: 'Produto não encontrado',
        message: 'Não encontramos o produto informado para este tenant.',
        recommendedAction: 'Revise o produto selecionado e tente novamente.',
      });
    }

    return this.prisma.product.update({
      where: { id: product.id },
      data: { photoUrl: buildPhotoUrl('products', tenantId, file.filename) },
    });
  }
}
