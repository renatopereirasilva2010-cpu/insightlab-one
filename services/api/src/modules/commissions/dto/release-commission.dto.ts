import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ReleaseCommissionDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
