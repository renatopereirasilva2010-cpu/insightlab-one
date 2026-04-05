import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAppointmentBlockDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  professionalId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  resourceId?: string;

  @IsDateString()
  startsAt!: string;

  @IsDateString()
  endsAt!: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  reason?: string;
}
