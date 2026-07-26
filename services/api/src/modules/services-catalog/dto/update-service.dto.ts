import { IsBoolean, IsEnum, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export enum UpdateServiceStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export class UpdateServiceDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationMinutes?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsBoolean()
  availableOnline?: boolean;

  @IsOptional()
  @IsBoolean()
  requiresProfessional?: boolean;

  @IsOptional()
  @IsEnum(UpdateServiceStatus)
  status?: UpdateServiceStatus;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  issRate?: number;
}
