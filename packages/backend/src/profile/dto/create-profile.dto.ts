import { IsArray, IsOptional, IsString } from 'class-validator';

export class CreateProfileDto {
  @IsString()
  username: string;

  @IsOptional()
  @IsString()
  bio: string;

  @IsOptional()
  @IsString()
  displayName: string;

  @IsOptional()
  @IsArray()
  socialLinks: string[];
}
