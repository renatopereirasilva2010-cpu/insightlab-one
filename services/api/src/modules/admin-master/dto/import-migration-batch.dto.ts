import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class ImportMigrationBatchDto {
  @IsString()
  @MaxLength(80)
  batchCode!: string;

  @IsNumber()
  @Min(0)
  importedCount!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
