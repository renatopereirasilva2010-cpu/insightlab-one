import { IsOptional, IsString, MaxLength } from 'class-validator';

export class MarkPayoutFailedDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  errorCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  errorMessage?: string;
}
