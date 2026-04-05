import { IsNumber, IsOptional, IsString, Length, Matches, Max, MaxLength, Min } from 'class-validator';

export class UpdateServiceFiscalDto {
  @IsOptional()
  @IsString()
  @Length(7, 7)
  @Matches(/^\d{7}$/, { message: 'cnaeCode must contain exactly 7 digits' })
  cnaeCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  serviceListItemCode?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  issRate?: number;
}