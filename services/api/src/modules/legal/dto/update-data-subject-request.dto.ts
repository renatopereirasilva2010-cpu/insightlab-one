import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum DataSubjectRequestStatusInput {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  REJECTED = 'REJECTED',
}

export class UpdateDataSubjectRequestDto {
  @IsEnum(DataSubjectRequestStatusInput)
  status!: DataSubjectRequestStatusInput;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  resolutionNotes?: string;
}
