import { IsString } from 'class-validator';

export default class PublishDonationPoolDto {
  @IsString()
  on_chain_id: bigint;

  @IsString()
  owner_address: string;
}
