import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import CreateDonationPoolDto from './dto/create-donation-pool.dto';
import { DonationPoolService } from './donation-pool.service';
import UpdateDonationPoolDto from './dto/update-donation-pool.dto';
import { GetUser } from '../user/user.decorator';
import { UserEntity } from '../user/entities/user.entity';
import { AuthGuard } from '../auth/auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('donation-pool')
export class DonationPoolController {
  constructor(private readonly donationPoolService: DonationPoolService) {}

  @UseGuards(AuthGuard)
  @Post()
  create(@GetUser() user: UserEntity, @Body() body: CreateDonationPoolDto) {
    return this.donationPoolService.create(body, user.profile.id);
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  get(@GetUser() user: UserEntity, @Param('id') id: string) {
    return this.donationPoolService.getOwned(id, user.profile.id);
  }

  @Patch(':id/update-avatar')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  updateImage(
    @Param('id') id: string,
    @GetUser() user: UserEntity,
    @UploadedFile() uploadedFile: Express.Multer.File,
  ) {
    return this.donationPoolService.update(id, user.profile.id, {
      image: `${uploadedFile.destination}/${uploadedFile.filename}`,
    });
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
