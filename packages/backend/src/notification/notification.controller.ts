import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  Sse,
  UseGuards,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { GetUser } from '../user/user.decorator';
import { AuthGuard } from '../auth/auth.guard';
import { UserEntity } from '../user/entities/user.entity';
import { UserI } from '../user/user.interface';

const MAX_LIMIT = 20;

// Defines a controller for handling notification-related endpoints
@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  // SSE (Server-Sent Events) endpoint for streaming real-time notifications to authenticated users
  @UseGuards(AuthGuard) // Ensures the user is authenticated
  @Sse('sse')
  stream(@Req() req: any, @GetUser() user: UserI) {
    // Connects the user to the notification stream (returns an Observable)
    const stream$ = this.notificationService.connectUser(user.id);

    // Handles client disconnects (e.g., tab close or network interruption)
    // and removes the user from the stream to free up resources
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    req.on('close', () => {
      this.notificationService.disconnectUser(user.id);
    });

    return stream$; // Return the stream to the client
  }

  @Get('/count-unread')
  @UseGuards(AuthGuard) // Protects the route with authentication
  async getTotalUnread(@GetUser() user: UserI) {
    return await this.notificationService.getTotalUnread(user.id);
  }

  // GET endpoint to retrieve all notifications for the authenticated user
  @Get()
  @UseGuards(AuthGuard) // Protects the route with authentication
  async getNotifications(
    @GetUser() user: UserI,
    @Query('offset') offset?: number,
    @Query('limit') limit?: number,
  ) {
    limit = Math.min(Math.max(limit ?? 50, 1), MAX_LIMIT);
    offset = Math.max(offset ?? 0, 0);
    return await this.notificationService.getNotifications(
      user.id,
      offset,
      limit,
    );
  }

  // PATCH endpoint to mark a specific notification as read
  @Patch(':id')
  @UseGuards(AuthGuard) // Ensures only authenticated users can access
  markAsRead(@Param('id') id: string, @GetUser() user: UserEntity) {
    return this.notificationService.markAsRead(id, user.id);
  }
}
