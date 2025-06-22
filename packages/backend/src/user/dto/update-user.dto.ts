import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateUserDto {
  @IsBoolean()
  @IsOptional()
  is_creator?: boolean;
}
