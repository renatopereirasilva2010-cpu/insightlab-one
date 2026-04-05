import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CancelAttendanceDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  reason?: string;
}
