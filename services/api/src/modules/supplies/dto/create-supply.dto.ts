import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateSupplyDto {
  @IsString()
  @MaxLength(150)
  name!: string;

  @IsString()
  @MaxLength(30)
  baseUnit!: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  operationalUnit?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  unitCost?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  initialStock?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minStock?: number;
}
