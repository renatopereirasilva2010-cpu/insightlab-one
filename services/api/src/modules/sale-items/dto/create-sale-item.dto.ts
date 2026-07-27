import { IsEnum, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export enum CreateSaleItemType {
  SERVICE = 'SERVICE',
  PRODUCT = 'PRODUCT',
}

export class CreateSaleItemDto {
  @IsEnum(CreateSaleItemType)
  itemType!: CreateSaleItemType;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  serviceId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  productId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  professionalId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;

  @IsNumber()
  @Min(0.001)
  quantity!: number;

  @IsNumber()
  @Min(0)
  unitPrice!: number;
}
