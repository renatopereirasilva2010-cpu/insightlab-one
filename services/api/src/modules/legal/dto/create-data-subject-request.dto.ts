import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export enum DataSubjectRequestTypeInput {
  ACCESS = 'ACCESS',
  CORRECTION = 'CORRECTION',
  DELETION = 'DELETION',
  PORTABILITY = 'PORTABILITY',
  CONSENT_REVOCATION = 'CONSENT_REVOCATION',
}

export class CreateDataSubjectRequestDto {
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  requesterName!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(160)
  requesterContact!: string;

  @IsEnum(DataSubjectRequestTypeInput)
  requestType!: DataSubjectRequestTypeInput;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}
