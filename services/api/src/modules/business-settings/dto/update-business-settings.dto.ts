import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export enum UpdateCommissionReleaseMode {
  ON_PAYMENT = 'ON_PAYMENT',
  MANUAL = 'MANUAL',
  IMMEDIATE = 'IMMEDIATE',
}

export class UpdateBusinessSettingsDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  timezone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(720)
  cancelPolicyHours?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(180)
  lateToleranceMinutes?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  deferredPaymentLabel?: string;

  @IsOptional()
  @IsBoolean()
  allowDeferredPayment?: boolean;

  @IsOptional()
  @IsEnum(UpdateCommissionReleaseMode)
  commissionReleaseMode?: UpdateCommissionReleaseMode;

  @IsOptional()
  @IsBoolean()
  allowCommissionManualRelease?: boolean;

  @IsOptional()
  @IsBoolean()
  commissionReleaseAllowDeferred?: boolean;
}
