import { PartialType } from '@nestjs/mapped-types';
import { CreateDonationPoolDto } from './create-donation-pool.dto';
import { DonationPoolStatus } from '../entities/donation-pool.entity';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateDonationPoolDto extends PartialType(CreateDonationPoolDto) {
  @IsString()
  @IsOptional()
  status?: DonationPoolStatus;

  @IsOptional()
  @IsNumber()
  on_chain_pool_id?: number;
}
