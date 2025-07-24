import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AuthGuard } from '../auth/auth.guard';
import { GetUser } from '../user/user.decorator';
import { UserEntity } from '../user/entities/user.entity';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @UseGuards(AuthGuard)
  getProfile(@GetUser() user: UserEntity) {
    return this.profileService.getProfile(user.profile.id);
  }

  @Patch()
  @UseGuards(AuthGuard)
  update(
    @GetUser() user: UserEntity,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.profileService.update(user.profile.id, updateProfileDto);
  }

  @Patch('verify-email')
  @UseGuards(AuthGuard)
  verifyEmail() {
    return 'Verify Email';
  }

  @Post('update-avatar')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('avatar'))
  updateAvatar(
    @GetUser() user: UserEntity,
    @UploadedFile() uploadedFile: Express.Multer.File,
  ) {
    return this.profileService.update(user.profile.id, {
      avatar: `${uploadedFile.destination}/${uploadedFile.filename}`,
    });
  }

  @Patch('update-cover')
  @UseInterceptors(FileInterceptor('cover'))
  @UseGuards(AuthGuard)
  updateCover(
    @GetUser() user: UserEntity,
    @UploadedFile() uploadedFile: Express.Multer.File,
  ) {
    return this.profileService.update(user.profile.id, {
      avatar: `${uploadedFile.destination}/${uploadedFile.filename}`,
    });
  }

  @Patch('follow')
  @UseGuards(AuthGuard)
  follow() {
    return 'follow';
  }

  @Patch('unfollow')
  @UseGuards(AuthGuard)
  unfollow() {
    return 'unfollow';
  }
}
