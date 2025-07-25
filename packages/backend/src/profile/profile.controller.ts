import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UnprocessableEntityException,
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
  verifyEmail(
    @GetUser() user: UserEntity,
    @Param('verificationCode') verificationCode: string,
  ) {
    if (!user.profile.email) {
      throw new UnprocessableEntityException('You must first save your email');
    }
    return this.profileService.verifyEmail(
      user.profile.email,
      verificationCode,
    );
  }

  @Patch('send-email-verification')
  @UseGuards(AuthGuard)
  sendVerificationEmail(@GetUser() user: UserEntity) {
    if (!user.profile.email) {
      throw new UnprocessableEntityException('You must first save your email');
    }
    return this.profileService.sendVerificationEmail(user.profile);
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
      cover: `${uploadedFile.destination}/${uploadedFile.filename}`,
    });
  }

  @Patch('/:followeeId/follow')
  @UseGuards(AuthGuard)
  follow(@GetUser() user: UserEntity, @Param('followeeId') followeeId: string) {
    return this.profileService.follow(user.profile.id, followeeId);
  }

  @Patch('/:followeeId/unfollow')
  @UseGuards(AuthGuard)
  unfollow(
    @GetUser() user: UserEntity,
    @Param('followeeId') followeeId: string,
  ) {
    return this.profileService.unfollow(user.profile.id, followeeId);
  }
}
