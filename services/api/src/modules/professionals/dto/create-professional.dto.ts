import { IsEmail, IsEnum, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export enum PayoutPixKeyTypeInput {
  CPF = 'CPF',
  CNPJ = 'CNPJ',
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  RANDOM = 'RANDOM',
}

export class CreateProfessionalDto {
  @IsString()
  @MaxLength(150)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(150)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  roleTitle?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  commissionRate?: number;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  payoutPixKey?: string;

  @IsOptional()
  @IsEnum(PayoutPixKeyTypeInput)
  payoutPixKeyType?: PayoutPixKeyTypeInput;
}
