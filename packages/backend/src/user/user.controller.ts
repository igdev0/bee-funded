import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from '../auth/auth.guard';
import { GetUser } from './user.decorator';
import { User } from './entities/user.entity';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Patch(':id')
  @UseGuards(AuthGuard)
  update(
    @Param('id') id: string,
    @GetUser() user: User,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    if (user.id !== id) {
      throw new UnauthorizedException(
        "You're not authorized to make updates to this account",
      );
    }
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  remove(@Param('id') id: string, @GetUser() user: User) {
    if (user.id !== id) {
      throw new UnauthorizedException(
        "You're not authorized to remove this user",
      );
    }
    return this.userService.remove(id);
  }
}
