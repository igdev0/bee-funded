import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AuthGuard } from '../auth/auth.guard';
import { GetUser } from '../user/user.decorator';
import { UserEntity } from '../user/entities/user.entity';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @UseGuards(AuthGuard)
  getProfile() {
    return 'Get profile';
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

  @Patch('update-avatar')
  @UseGuards(AuthGuard)
  updateAvatar() {
    return 'Update Avatar';
  }

  @Patch('update-cover')
  @UseGuards(AuthGuard)
  updateCover() {
    return 'Update Cover';
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
