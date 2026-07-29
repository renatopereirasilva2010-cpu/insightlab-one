import { IsBoolean, IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateAppointmentDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  clientId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  professionalId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  serviceId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  resourceId?: string;

  @IsOptional()
  @IsDateString()
  startAt?: string;

  @IsOptional()
  @IsDateString()
  endAt?: string;

  @IsOptional()
  @IsBoolean()
  isOverbook?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
