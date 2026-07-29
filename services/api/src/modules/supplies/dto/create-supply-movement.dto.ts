import { IsEnum, IsNumber, IsOptional, IsString, MaxLength, NotEquals } from 'class-validator';

export enum SupplyMovementTypeInput {
  ENTRY = 'ENTRY',
  SALE_CONSUMPTION = 'SALE_CONSUMPTION',
  INTERNAL_USE = 'INTERNAL_USE',
  ADJUSTMENT = 'ADJUSTMENT',
}

export class CreateSupplyMovementDto {
  @IsEnum(SupplyMovementTypeInput)
  type!: SupplyMovementTypeInput;

  /** Quantidade na unidade informada em `unit`. Negativa apenas para ADJUSTMENT (correção para baixo). */
  @IsNumber()
  @NotEquals(0)
  quantity!: number;

  @IsString()
  @MaxLength(30)
  unit!: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  reason?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  referenceType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  referenceId?: string;
}
