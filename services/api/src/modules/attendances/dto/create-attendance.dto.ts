import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAttendanceDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  appointmentId?: string;

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
  @MaxLength(500)
  notes?: string;
}
