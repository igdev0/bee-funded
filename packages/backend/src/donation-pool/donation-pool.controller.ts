import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { DonationPoolService } from './donation-pool.service';
import { CreateDonationPoolDto } from './dto/create-donation-pool.dto';
import { UpdateDonationPoolDto } from './dto/update-donation-pool.dto';

@Controller('donation-pool')
export class DonationPoolController {
  constructor(private readonly donationPoolService: DonationPoolService) {}

  @Post()
  create(@Body() createDonationPoolDto: CreateDonationPoolDto) {
    return this.donationPoolService.create(createDonationPoolDto);
  }

  @Get()
  findAll() {
    return this.donationPoolService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.donationPoolService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDonationPoolDto: UpdateDonationPoolDto,
  ) {
    return this.donationPoolService.update(id, updateDonationPoolDto);
  }
}
