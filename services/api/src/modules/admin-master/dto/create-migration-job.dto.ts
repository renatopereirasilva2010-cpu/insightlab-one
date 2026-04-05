import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum CreateMigrationSourceType {
  AZ_FDB = 'AZ_FDB',
  CSV = 'CSV',
  XLSX = 'XLSX',
  MANUAL = 'MANUAL',
}

export class CreateMigrationJobDto {
  @IsEnum(CreateMigrationSourceType)
  sourceType!: CreateMigrationSourceType;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  sourceReference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
