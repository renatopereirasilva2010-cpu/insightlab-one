import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CancelCommissionDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
