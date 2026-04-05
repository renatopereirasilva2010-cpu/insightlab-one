import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class GenerateCommissionDto {
  @IsString()
  @MaxLength(50)
  saleId!: string;

  @IsString()
  @MaxLength(50)
  professionalId!: string;

  @IsNumber()
  @Min(0)
  baseAmount!: number;

  @IsNumber()
  @Min(0)
  commissionAmount!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
