import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateUnitConversionDto {
  @IsString()
  @MaxLength(50)
  supplyItemId!: string;

  @IsString()
  @MaxLength(30)
  fromUnit!: string;

  @IsString()
  @MaxLength(30)
  toUnit!: string;

  @IsNumber()
  @Min(0.000001)
  factor!: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  roundingRule?: string;
}
