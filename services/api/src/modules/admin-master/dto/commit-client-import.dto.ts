import { IsArray, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class CommitClientImportDto {
  @IsString()
  @MaxLength(300)
  fileToken!: string;

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

  /** Índices de linha (mesmo rowIndex retornado pela análise) que o usuário confirmou que quer importar. */
  @IsArray()
  @IsInt({ each: true })
  acceptedRowIndexes!: number[];
}
