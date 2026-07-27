import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export enum CreatePaymentMethod {
  CASH = 'CASH',
  PIX = 'PIX',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  DEFERRED = 'DEFERRED',
}

export class CreatePaymentDto {
  @IsString()
  @MaxLength(50)
  saleId!: string;

  @IsEnum(CreatePaymentMethod)
  method!: CreatePaymentMethod;

  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsString()
  @MaxLength(50)
  cashRegisterId!: string;

  @IsOptional()
  @IsBoolean()
  isDeferred?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  deferredDueDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  externalReference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
