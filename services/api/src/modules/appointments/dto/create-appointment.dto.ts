import { IsBoolean, IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAppointmentDto {
  @IsString()
  @MaxLength(50)
  clientId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  professionalId?: string;

  @IsString()
  @MaxLength(50)
  serviceId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  resourceId?: string;

  @IsDateString()
  startAt!: string;

  @IsDateString()
  endAt!: string;

  @IsOptional()
  @IsBoolean()
  isWalkIn?: boolean;

  @IsOptional()
  @IsBoolean()
  isOverbook?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
