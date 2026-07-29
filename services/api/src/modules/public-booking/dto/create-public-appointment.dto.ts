import { Equals, IsDateString, IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreatePublicAppointmentDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  clientName!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(20)
  clientPhone!: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(160)
  clientEmail?: string;

  @IsString()
  @MaxLength(50)
  serviceId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  professionalId?: string;

  @IsDateString()
  startAt!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @Equals(true, { message: 'É necessário aceitar a Política de Privacidade para agendar.' })
  acceptedPrivacyPolicy!: boolean;
}
