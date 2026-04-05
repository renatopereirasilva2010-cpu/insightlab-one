import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @MaxLength(150)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  sku?: string;

  @IsNumber()
  @Min(0)
  salePrice!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cost?: number;
}
