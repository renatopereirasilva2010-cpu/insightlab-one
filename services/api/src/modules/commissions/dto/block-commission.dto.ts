import { IsOptional, IsString, MaxLength } from 'class-validator';

export class BlockCommissionDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
