import { IsBoolean, IsEmail, IsString } from 'class-validator';

export class SignupDto {
  @IsEmail()
  email: string;
  @IsString()
  address: string;

  @IsString()
  username: string;

  @IsString()
  message: string;

  @IsString()
  signature: string;

  @IsBoolean()
  complete: boolean;

  @IsString()
  nonce: string;
}
