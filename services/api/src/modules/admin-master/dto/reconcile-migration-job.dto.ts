import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class ReconcileMigrationJobDto {
  @IsNumber()
  @Min(0)
  reconciledRecords!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
