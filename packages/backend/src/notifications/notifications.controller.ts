import { Controller, Get, Req, Sse, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { GetUser } from '../decorators/get-user.decorator';
import { User } from '../user/entities/user.entity';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @UseGuards(AuthGuard)
  @Sse()
  stream(@Req() req: any, @GetUser() user: User) {
    const stream$ = this.notificationsService.connectUser(user.id as string);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    req.on('close', () => {
      this.notificationsService.disconnectUser(user.id as string);
    });

    return stream$;
  }

  @Get()
  @UseGuards(AuthGuard)
  getNotifications(@Req() req: any, @GetUser() user: User) {
    // this.notificationsService.sendToUser(user.id as string, {
    //   type: 'test',
    //   data: 'this is a test',
    // });
    // console.log('Sending to user');
    return user;
  }
}
