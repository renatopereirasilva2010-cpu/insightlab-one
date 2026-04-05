import { IsBoolean, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export class UpdateAvailabilityDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  professionalId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  weekday?: number;

  @IsOptional()
  @IsString()
  @Matches(TIME_PATTERN, { message: 'startTime must be in HH:mm format' })
  startTime?: string;

  @IsOptional()
  @IsString()
  @Matches(TIME_PATTERN, { message: 'endTime must be in HH:mm format' })
  endTime?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}