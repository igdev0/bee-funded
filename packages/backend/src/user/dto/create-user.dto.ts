import { IsString } from 'class-validator';

export class CreateUserDto {
  @IsString()
  wallet_address: string;
}
