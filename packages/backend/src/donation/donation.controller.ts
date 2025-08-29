import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { GetUser } from '../user/user.decorator';
import { UserEntity } from '../user/entities/user.entity';
import { DonationService } from './donation.service';

@Controller('donation')
export class DonationController {
  constructor(private readonly donationService: DonationService) {}

  @Get()
  @UseGuards(AuthGuard)
  getOwnedDonations(
    @Query('limit') limit: number,
    @Query('page') page: number,
    @GetUser() user: UserEntity,
  ) {
    return this.donationService.getManyOwned(user.profile.id, page, limit);
  }

  @Get('by-pool/:poolId')
  getByPool(
    @Param('poolId') poolId: string,
    @Query('limit') limit: number,
    @Query('page') page: number,
  ) {
    return this.donationService.getManyByPoolId(poolId, limit, page);
  }
}
