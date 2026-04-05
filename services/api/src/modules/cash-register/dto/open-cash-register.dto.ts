import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class OpenCashRegisterDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  openingBalance?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
