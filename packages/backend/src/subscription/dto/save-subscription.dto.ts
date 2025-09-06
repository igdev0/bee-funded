import { IsNumber, IsNumberString, IsString } from 'class-validator';

export default class SaveSubscriptionDto {
  @IsNumber()
  subscription_id: number;

  @IsNumber()
  pool_id: number;

  @IsString()
  subscriber: string;

  @IsString()
  token: string;

  @IsString()
  beneficiary: string;

  @IsNumberString()
  amount: string;

  @IsNumber()
  interval: number;

  @IsNumber()
  remaining_payments: number;

  @IsNumber()
  deadline: number;
}
