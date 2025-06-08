import { IsString } from 'class-validator';

export default class SigninDto {
  @IsString()
  nonce: string;

  @IsString()
  address: string;

  @IsString()
  message: string;

  @IsString()
  signature: string;
}