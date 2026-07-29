import { IsEnum } from 'class-validator';

export enum AcceptConsentType {
  TERMS_OF_USE = 'TERMS_OF_USE',
  PRIVACY_POLICY = 'PRIVACY_POLICY',
}

export class AcceptConsentDto {
  @IsEnum(AcceptConsentType)
  type!: AcceptConsentType;
}
