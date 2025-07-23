import { IsArray, IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  username?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsArray()
  socialLinks?: string[];
}
