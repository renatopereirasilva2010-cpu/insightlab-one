import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class SuggestSlotsDto {
  @IsString()
  @MaxLength(50)
  professionalId!: string;

  @IsString()
  @MaxLength(50)
  serviceId!: string;

  @IsOptional()
  @IsDateString()
  fromDate?: string;
}
