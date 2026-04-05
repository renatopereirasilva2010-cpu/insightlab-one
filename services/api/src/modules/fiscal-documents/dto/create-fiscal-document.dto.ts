import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateFiscalDocumentDto {
  @IsString()
  @MaxLength(50)
  sourceType!: string;

  @IsString()
  @MaxLength(50)
  sourceId!: string;

  @IsString()
  @MaxLength(30)
  documentType!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  provider?: string;
}