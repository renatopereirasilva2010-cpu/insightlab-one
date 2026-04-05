import { IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator';

export class UpdateUnitFiscalDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  legalName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  tradeName?: string;

  @IsOptional()
  @IsString()
  @Length(14, 14)
  @Matches(/^\d{14}$/, { message: 'cnpj must contain exactly 14 digits' })
  cnpj?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  municipalRegistration?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  stateRegistration?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  addressLine1?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  addressNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  addressComplement?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  district?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @Length(2, 2)
  @Matches(/^[A-Z]{2}$/, { message: 'state must be a 2-letter uppercase UF' })
  state?: string;

  @IsOptional()
  @IsString()
  @Length(8, 8)
  @Matches(/^\d{8}$/, { message: 'postalCode must contain exactly 8 digits' })
  postalCode?: string;

  @IsOptional()
  @IsString()
  @Length(7, 7)
  @Matches(/^\d{7}$/, { message: 'ibgeCityCode must contain exactly 7 digits' })
  ibgeCityCode?: string;
}
