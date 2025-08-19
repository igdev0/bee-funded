import { IsNumberString, IsOptional, IsString } from 'class-validator';

export class SaveDonationDto {
  /**
   * The on-chain donation pool ID
   */
  @IsNumberString()
  pool_id: string;

  /**
   * A boolean indicating if the donation is recurring
   */
  is_recurring: boolean;

  /**
   * The donor ethereum wallet address
   */
  @IsString()
  donor_address: string;

  /**
   * The token address
   */
  @IsString()
  token: string;

  /**
   * The amount of token as a bigint
   */
  @IsNumberString()
  amount: string;

  /**
   * The optional message associated with the donation.
   */
  @IsString()
  @IsOptional()
  message: string;
}
