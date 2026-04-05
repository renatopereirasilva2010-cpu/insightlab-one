import { IsOptional, IsString, MaxLength } from 'class-validator';

export class QueryFiscalDocumentsDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  sourceType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  sourceId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  documentType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  referenceNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  accessKey?: string;
}