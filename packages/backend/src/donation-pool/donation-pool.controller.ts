import { Body, Controller, Post } from '@nestjs/common';
import CreateDonationPoolDto from './dto/create-donation-pool.dto';
import { DonationPoolService } from './donation-pool.service';

@Controller('donation-pool')
export class DonationPoolController {
  constructor(private readonly donationPoolService: DonationPoolService) {}
  @Post()
  create(@Body() body: CreateDonationPoolDto) {
    return this.donationPoolService.create(body);
  }
}
