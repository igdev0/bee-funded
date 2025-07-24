import { IsArray, IsEmail, IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  username?: string;

  @IsUrl()
  @IsOptional()
  avatar?: string;

  @IsUrl()
  @IsOptional()
  cover?: string;

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
