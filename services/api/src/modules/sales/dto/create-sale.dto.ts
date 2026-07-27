import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSaleDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  attendanceId?: string;

  @IsString()
  @MaxLength(50)
  clientId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  professionalId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
