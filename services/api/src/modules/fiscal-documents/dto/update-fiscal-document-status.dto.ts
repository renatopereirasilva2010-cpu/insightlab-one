import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateFiscalDocumentStatusDto {
  @IsString()
  @MaxLength(30)
  status!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  message?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  referenceNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  accessKey?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  errorCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  errorMessage?: string;
}