import { Injectable, MessageEvent } from '@nestjs/common';
import { Subject } from 'rxjs';

export interface NotificationData {
  type: string;
  data: any;
}

@Injectable()
export class NotificationsService {
  private userStreams = new Map<string, Subject<MessageEvent>>();

  connectUser(userId: string): Subject<MessageEvent> {
    const stream = new Subject<MessageEvent>();
    this.userStreams.set(userId, stream);
    return stream;
  }

  disconnectUser(userId: string) {
    const stream = this.userStreams.get(userId);
    if (stream) {
      stream.complete();
      this.userStreams.delete(userId);
    }
  }

  sendToUser(userId: string, data: NotificationData) {
    const stream = this.userStreams.get(userId);
    if (stream) {
      stream.next({ data });
    }
  }
}
