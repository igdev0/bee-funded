import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { DonationPoolService } from './donation-pool.service';
import { CreateDonationPoolDto } from './dto/create-donation-pool.dto';
import { UpdateDonationPoolDto } from './dto/update-donation-pool.dto';
import { AuthGuard } from '../auth/auth.guard';
import { UserService } from '../user/user.service';
import { GetUser } from '../decorators/get-user.decorator';
import { User } from '../user/entities/user.entity';

@Controller('donation-pool')
export class DonationPoolController {
  constructor(
    private readonly donationPoolService: DonationPoolService,
    private readonly userService: UserService,
  ) {}

  @UseGuards(AuthGuard)
  @Post()
  async create(
    @Body() createDonationPoolDto: CreateDonationPoolDto,
    @GetUser() user: User,
  ) {
    await this.userService.updateUser(user.id as string, { is_creator: true });
    return this.donationPoolService.create(user.id as string, {
      ...createDonationPoolDto,
    });
  }

  @Get()
  findAll() {
    return this.donationPoolService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.donationPoolService.findOne(id);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDonationPoolDto: UpdateDonationPoolDto,
  ) {
    return this.donationPoolService.update(id, updateDonationPoolDto);
  }
}
