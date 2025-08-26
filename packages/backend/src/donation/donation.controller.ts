import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { GetUser } from '../user/user.decorator';
import { UserEntity } from '../user/entities/user.entity';
import { DonationService } from './donation.service';

@Controller('donation')
export class DonationController {
  constructor(private readonly donationService: DonationService) {}
  @Get()
  @UseGuards(AuthGuard)
  getOwnedDonations(@GetUser() user: UserEntity) {}
}
