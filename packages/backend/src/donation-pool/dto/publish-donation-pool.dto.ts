import { IsNumber, IsString } from 'class-validator';

export default class PublishDonationPoolDto {
  @IsNumber()
  on_chain_id: number;

  @IsString()
  owner_address: string;
}
