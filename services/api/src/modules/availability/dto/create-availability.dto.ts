import { IsBoolean, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export class CreateAvailabilityDto {
  @IsString()
  @MaxLength(50)
  professionalId!: string;

  @IsInt()
  @Min(0)
  @Max(6)
  weekday!: number;

  @IsString()
  @Matches(TIME_PATTERN, { message: 'startTime must be in HH:mm format' })
  startTime!: string;

  @IsString()
  @Matches(TIME_PATTERN, { message: 'endTime must be in HH:mm format' })
  endTime!: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}