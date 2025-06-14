import { PartialType } from '@nestjs/mapped-types';
import { CreateDonationPoolDto } from './create-donation-pool.dto';

export class UpdateDonationPoolDto extends PartialType(CreateDonationPoolDto) {}
