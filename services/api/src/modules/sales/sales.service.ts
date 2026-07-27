import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { CreateSaleItemDto } from '../sale-items/dto/create-sale-item.dto';

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  findAllByTenant(tenantId: string) {
    return this.prisma.sale.findMany({
      where: { tenantId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(tenantId: string, unitId: string | null, dto: CreateSaleDto) {
    return this.prisma.sale.create({
      data: {
        tenantId,
        unitId,
        attendanceId: dto.attendanceId,
        clientId: dto.clientId,
        professionalId: dto.professionalId,
        notes: dto.notes,
      },
    });
  }

  async addItem(tenantId: string, unitId: string | null, saleId: string, dto: CreateSaleItemDto) {
    const sale = await this.prisma.sale.findFirst({
      where: { id: saleId, tenantId },
    });

    if (!sale) {
      throw new NotFoundException({
        code: 'SALE_NOT_FOUND',
        title: 'Venda não encontrada',
        message: 'Não encontramos a venda informada.',
        recommendedAction: 'Atualize a tela e tente novamente.',
      });
    }

    if (sale.status !== 'OPEN') {
      throw new BadRequestException({
        code: 'SALE_CLOSED_FOR_EDIT',
        title: 'Venda indisponível para edição',
        message: 'Somente vendas abertas podem receber novos itens.',
        recommendedAction: 'Revise o status da venda antes de tentar novamente.',
      });
    }

    if (dto.itemType === 'SERVICE' && !dto.serviceId) {
      throw new BadRequestException({
        code: 'SALE_ITEM_SERVICE_REQUIRED',
        title: 'Serviço não informado',
        message: 'Itens do tipo serviço precisam de um serviceId válido.',
        recommendedAction: 'Informe o serviço antes de continuar.',
      });
    }

    if (dto.itemType === 'PRODUCT' && !dto.productId) {
      throw new BadRequestException({
        code: 'SALE_ITEM_PRODUCT_REQUIRED',
        title: 'Produto não informado',
        message: 'Itens do tipo produto precisam de um productId válido.',
        recommendedAction: 'Informe o produto antes de continuar.',
      });
    }

    if (dto.professionalId) {
      const professional = await this.prisma.professional.findFirst({
        where: { id: dto.professionalId, tenantId },
      });

      if (!professional) {
        throw new NotFoundException({
          code: 'PROFESSIONAL_NOT_FOUND',
          title: 'Profissional não encontrado',
          message: 'Não encontramos o profissional informado para este tenant.',
          recommendedAction: 'Revise o profissional selecionado e tente novamente.',
        });
      }
    }

    const totalPrice = Number(dto.quantity) * Number(dto.unitPrice);

    const item = await this.prisma.saleItem.create({
      data: {
        tenantId,
        unitId,
        saleId: sale.id,
        itemType: dto.itemType as any,
        serviceId: dto.serviceId,
        productId: dto.productId,
        professionalId: dto.professionalId,
        description: dto.description,
        quantity: dto.quantity,
        unitPrice: dto.unitPrice,
        totalPrice,
      },
    });

    await this.recalculate(tenantId, sale.id);
    return item;
  }

  async recalculate(tenantId: string, saleId: string) {
    const sale = await this.prisma.sale.findFirst({
      where: { id: saleId, tenantId },
      include: { items: true },
    });

    if (!sale) {
      throw new NotFoundException({
        code: 'SALE_NOT_FOUND',
        title: 'Venda não encontrada',
        message: 'Não encontramos a venda informada.',
        recommendedAction: 'Atualize a tela e tente novamente.',
      });
    }

    const subtotal = sale.items.reduce((acc, item) => acc + Number(item.totalPrice), 0);
    const totalAmount = subtotal - Number(sale.discountAmount);

    return this.prisma.sale.update({
      where: { id: sale.id },
      data: {
        subtotal,
        totalAmount,
      },
      include: { items: true },
    });
  }

  async readyForCheckout(tenantId: string, saleId: string) {
    const sale = await this.prisma.sale.findFirst({
      where: { id: saleId, tenantId },
      include: { items: true },
    });

    if (!sale) {
      throw new NotFoundException({
        code: 'SALE_NOT_FOUND',
        title: 'Venda não encontrada',
        message: 'Não encontramos a venda informada.',
        recommendedAction: 'Atualize a tela e tente novamente.',
      });
    }

    if (sale.items.length === 0) {
      throw new BadRequestException({
        code: 'SALE_WITHOUT_ITEMS',
        title: 'Venda sem itens',
        message: 'Não é possível enviar para checkout uma venda sem itens.',
        recommendedAction: 'Adicione pelo menos um item antes de continuar.',
      });
    }

    const serviceItemWithoutProfessional = sale.items.find(
      (item) => item.itemType === 'SERVICE' && !item.professionalId,
    );

    if (serviceItemWithoutProfessional) {
      throw new BadRequestException({
        code: 'SALE_ITEM_MISSING_PROFESSIONAL',
        title: 'Item de serviço sem profissional',
        message:
          'Todo item de serviço precisa de um profissional responsável antes do checkout.',
        recommendedAction: 'Defina o profissional em cada item de serviço e tente novamente.',
      });
    }

    if (sale.status === 'CANCELED') {
      throw new BadRequestException({
        code: 'SALE_ALREADY_CANCELED',
        title: 'Venda cancelada',
        message: 'Não é possível enviar para checkout uma venda cancelada.',
        recommendedAction: 'Revise o histórico antes de tentar novamente.',
      });
    }

    return this.prisma.sale.update({
      where: { id: sale.id },
      data: {
        status: 'READY_FOR_CHECKOUT',
      },
      include: { items: true },
    });
  }

  async cancel(tenantId: string, saleId: string) {
    const sale = await this.prisma.sale.findFirst({
      where: { id: saleId, tenantId },
    });

    if (!sale) {
      throw new NotFoundException({
        code: 'SALE_NOT_FOUND',
        title: 'Venda não encontrada',
        message: 'Não encontramos a venda informada.',
        recommendedAction: 'Atualize a tela e tente novamente.',
      });
    }

    if (sale.status === 'COMPLETED') {
      throw new BadRequestException({
        code: 'SALE_ALREADY_COMPLETED',
        title: 'Venda já concluída',
        message: 'Não é possível cancelar uma venda já concluída.',
        recommendedAction: 'Revise o histórico antes de tentar novamente.',
      });
    }

    if (sale.status === 'CANCELED') {
      throw new BadRequestException({
        code: 'SALE_ALREADY_CANCELED',
        title: 'Venda já cancelada',
        message: 'Esta venda já foi cancelada anteriormente.',
        recommendedAction: 'Atualize a tela antes de tentar uma nova ação.',
      });
    }

    return this.prisma.sale.update({
      where: { id: sale.id },
      data: {
        status: 'CANCELED',
      },
      include: { items: true },
    });
  }
}
