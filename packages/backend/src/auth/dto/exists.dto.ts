import { IsOptional, IsString } from 'class-validator';

export default class ExistsDto {
  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  username?: string;
}
