import { IsString } from 'class-validator';

export default class PublishDonationPoolDto {
  @IsString()
  on_chain_id: string;

  @IsString()
  owner_address: string;
}
