import {
  Body,
  Controller,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import CreateDonationPoolDto from './dto/create-donation-pool.dto';
import { DonationPoolService } from './donation-pool.service';
import UpdateDonationPoolDto from './dto/update-donation-pool.dto';
import { GetUser } from '../user/user.decorator';
import { UserEntity } from '../user/entities/user.entity';
import { AuthGuard } from '../auth/auth.guard';

@Controller('donation-pool')
export class DonationPoolController {
  constructor(private readonly donationPoolService: DonationPoolService) {}

  @UseGuards(AuthGuard)
  @Post()
  create(@Body() body: CreateDonationPoolDto) {
    return this.donationPoolService.create(body);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @GetUser() user: UserEntity,
    @Body() body: UpdateDonationPoolDto,
  ) {
    return this.donationPoolService.update(id, user.profile.id, body);
  }
}
