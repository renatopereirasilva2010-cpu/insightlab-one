import { IsOptional, IsString, MaxLength } from 'class-validator';

export class MarkFailedPaymentDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  errorCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  errorMessage?: string;
}
