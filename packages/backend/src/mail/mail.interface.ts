export interface EmailVerification {
  code: string;
  name: string;
  expiresIn: string;
}

export interface NotificationMailContext {
  name: string;
  actorImage: string;
  actorDisplayName: string;
  notificationMessage: string;
  actionPath: string;
  notificationsSettingsPath: string;
}

export type ActorNotificationMessage = Omit<
  NotificationMailContext,
  'notificationsSettingsPath'
>;

export interface Envelope {
  from: string;
  to: string[];
}

export interface MailResponse {
  accepted: string[];
  rejected: any[];
  ehlo: string[];
  envelopeTime: number;
  messageTime: number;
  messageSize: number;
  response: string;
  envelope: Envelope;
  messageId: string;
}
