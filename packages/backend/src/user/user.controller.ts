import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { GetUser } from '../decorators/get-user.decorator';
import { User } from './entities/user.entity';
import { DonationPoolService } from '../donation-pool/donation-pool.service';

@Controller('user')
export default class UserController {
  constructor(private readonly donationPoolService: DonationPoolService) {}

  @Get('donation-pools')
  @UseGuards(AuthGuard)
  getUserPools(@GetUser() user: User) {
    return this.donationPoolService.findAllByUserId(user.id as string);
  }
}
