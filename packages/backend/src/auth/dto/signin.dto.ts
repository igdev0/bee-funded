import { IsString } from 'class-validator';

export default class SigninDto {
  @IsString()
  message: string;
  @IsString()
  signature: string;
}
