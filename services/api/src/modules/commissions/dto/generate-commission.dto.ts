import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class GenerateCommissionDto {
  @IsString()
  @MaxLength(50)
  saleItemId!: string;

  @IsNumber()
  @Min(0)
  baseAmount!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
