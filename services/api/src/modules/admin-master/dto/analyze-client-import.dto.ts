import { IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Campos de texto que acompanham o upload multipart (multer entrega o
 * arquivo separado via @UploadedFile - estes são os demais campos do form).
 * Todos opcionais: sem eles, o mapeamento é 100% sugerido automaticamente.
 */
export class AnalyzeClientImportDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  nameColumn?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  phoneColumn?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  emailColumn?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  sourceColumn?: string;
}
