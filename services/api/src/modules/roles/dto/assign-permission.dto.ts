import { IsString } from 'class-validator';

export class AssignPermissionDto {
  @IsString()
  permissionCode!: string;
}
