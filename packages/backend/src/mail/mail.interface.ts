export interface EmailVerificationContext {
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
  actionUrl?: string;
  notificationsSettingsPath: string;
  notificationsSettingsUrl?: string;
}

export interface DonationReceivedContext {
  donorName: string;
  date: string;
  amount: string;
  txHash: string;
  explorerUrl: string;
  year: string | number;
}

export interface DonationReceiptContext {
  donorName: string;
  date: string;
  amount: string | number;
  token: string;
  txHash: string;
  explorerUrl: string;
  recipient: string;
  year: string | number;
}

export interface EmailVerificationContextPayload
  extends EmailVerificationContext {
  verificationUrl: string;
}

export type SendMailTemplates =
  | {
      template: 'notification';
      context: NotificationMailContext;
    }
  | {
      template: 'email-verification';
      context: EmailVerificationContextPayload;
    }
  | {
      template: 'donation-receipt';
      context: DonationReceiptContext;
    }
  | {
      template: 'donation-received';
      context: DonationReceivedContext;
    };

export type SendMailPayload = {
  to: string;
  subject: string;
} & SendMailTemplates;

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
