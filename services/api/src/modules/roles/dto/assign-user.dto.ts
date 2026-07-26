import { IsString } from 'class-validator';

export class AssignUserDto {
  @IsString()
  userId!: string;
}
