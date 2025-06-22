import { Injectable, MessageEvent } from '@nestjs/common';
import { Subject } from 'rxjs';

export const NotificationEvents = {
  POOL_PUBLISHED: 'POOL_PUBLISHED',
  DONATION_RECEIVED: 'DONATION_RECEIVED',
};

export type NotificationEvents =
  (typeof NotificationEvents)[keyof typeof NotificationEvents];

export type NotificationDataType = {
  message: string;
};

export interface NotificationData {
  type: NotificationEvents;
  data: NotificationDataType;
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
