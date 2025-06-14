import { Injectable } from '@nestjs/common';
import { CreateDonationPoolDto } from './dto/create-donation-pool.dto';
import { UpdateDonationPoolDto } from './dto/update-donation-pool.dto';

@Injectable()
export class DonationPoolService {
  create(createDonationPoolDto: CreateDonationPoolDto) {
    return 'This action adds a new donationPool';
  }

  findAll() {
    return `This action returns all donationPool`;
  }

  findOne(id: string) {
    return `This action returns a #${id} donationPool`;
  }

  update(id: string, updateDonationPoolDto: UpdateDonationPoolDto) {
    return `This action updates a #${id} donationPool`;
  }
}
