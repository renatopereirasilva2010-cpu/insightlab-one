import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateServiceDto {
  @IsString()
  @MaxLength(150)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsInt()
  @Min(1)
  durationMinutes!: number;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsString()
  @Length(7, 7)
  @Matches(/^\d{7}$/, { message: 'cnaeCode must contain exactly 7 digits' })
  cnaeCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  serviceListItemCode?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  issRate?: number;

  @IsOptional()
  @IsBoolean()
  availableOnline?: boolean;
}