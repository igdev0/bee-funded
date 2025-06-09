import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class SignupDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @Length(1, 255)
  username: string;

  @IsOptional()
  @IsString()
  @Length(0, 255)
  bio?: string;

  @IsOptional()
  @IsString()
  @Length(0, 255)
  display_name?: string;

  @IsOptional()
  @IsBoolean()
  is_creator?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @IsBoolean()
  accepted_terms: boolean;

  @IsString()
  message: string;

  @IsString()
  signature: string;

  @IsString()
  nonce: string;
}
