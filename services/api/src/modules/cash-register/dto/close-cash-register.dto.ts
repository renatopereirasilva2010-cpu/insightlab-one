import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CloseCashRegisterDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  closingBalance?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
