import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum MarkPayoutMethod {
  PIX = 'PIX',
  BANK_TRANSFER = 'BANK_TRANSFER',
  MANUAL = 'MANUAL',
}

export class MarkPayoutPaidDto {
  @IsOptional()
  @IsEnum(MarkPayoutMethod)
  method?: MarkPayoutMethod;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  providerReference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  notes?: string;
}
