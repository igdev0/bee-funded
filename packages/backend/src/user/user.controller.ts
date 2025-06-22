import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard } from '../auth/auth.guard';
import { GetUser } from '../decorators/get-user.decorator';
import { User } from './entities/user.entity';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(AuthGuard)
  @Post('update-is-creator')
  async updateIsCreator(
    @Body() body: { is_creator: boolean },
    @GetUser() user: User,
  ) {
    return this.userService.updateUser(user.id as string, body);
  }
}
