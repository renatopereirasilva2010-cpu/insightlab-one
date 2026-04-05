import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateResourceDto {
  @IsString()
  @MaxLength(150)
  name!: string;

  @IsString()
  @MaxLength(50)
  type!: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;
}
