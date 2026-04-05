import { IsDateString, IsString, MaxLength } from 'class-validator';

export class QueryAvailabilityDto {
  @IsString()
  @MaxLength(50)
  professionalId!: string;

  @IsDateString()
  date!: string;
}