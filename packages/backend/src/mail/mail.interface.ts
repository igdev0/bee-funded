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
  year?: string | number;
}

export interface DonationReceiptContext {
  donorName: string;
  date: string;
  amount: string | number;
  token: string;
  txHash: string;
  explorerUrl: string;
  recipient: string;
  year?: string | number;
}

export interface NewSubscriberEmailContext {
  poolName: string;
  poolOwnerName: string;
  subscriptionId: string;
  poolId: string;

  subscriberAddress: string;
  subscriberName?: string;

  beneficiaryAddress: string;
  beneficiaryName?: string;

  amount: string | number;
  tokenDecimals: number;
  token: string; // used in `{{tokenSymbol token}}`

  intervalHuman: string;
  remainingPayments: number;

  deadline?: number; // formatted via `formatDate`
}

export interface EmailVerificationContextPayload
  extends EmailVerificationContext {
  verificationUrl: string;
}

export interface SubscriptionReceiptEmailContext {
  subscriberName: string;

  poolName: string;
  subscriptionId: string;
  poolId: string;

  beneficiaryAddress: string;
  beneficiaryName?: string;

  amount: string | number;
  tokenDecimals: number;
  token: string;
  tokenSymbol: string;

  intervalHuman: string;
  remainingPayments: number;

  deadline?: Date | number; // formatted with {{formatDate}}
}

export interface UnsubscribedReceiptEmailContext {
  subscriberName: string;

  poolName: string;
  subscriptionId: string;
  poolId: string;

  beneficiaryAddress: string;
  beneficiaryName?: string;

  completedPayments: number;
  totalPayments: number;
}

export interface UnsubscribedPoolOwnerNoticeEmailContext {
  poolName: string;
  poolOwnerName: string;

  subscriptionId: string;
  poolId: string;

  subscriberAddress: string;
  subscriberName?: string;

  beneficiaryAddress: string;
  beneficiaryName?: string;

  completedPayments: number;
  totalPayments: number;
}

export interface SubscriptionExpiredEmailContext {
  subscriberName: string;

  poolName: string;
  subscriptionId: string;
  poolId: string;

  beneficiaryAddress: string;
  beneficiaryName?: string;

  completedPayments: number;
  totalPayments: number;
}

export interface SubscriptionExpiredPoolOwnerEmailContext {
  poolName: string;
  poolOwnerName: string;

  subscriptionId: string;
  poolId: string;

  subscriberAddress: string;
  subscriberName?: string;

  beneficiaryAddress: string;
  beneficiaryName?: string;

  completedPayments: number;
  totalPayments: number;

  expiredAt?: Date | string;
  lastPaymentDate?: Date | string;
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
    }
  | {
      template: 'new-subscriber';
      context: NewSubscriberEmailContext;
    }
  | {
      template: 'subscription-receipt';
      context: SubscriptionReceiptEmailContext;
    }
  | {
      template: 'subscription-expired';
      context: SubscriptionExpiredEmailContext;
    }
  | {
      template: 'subscription-expired-pool-owner';
      context: SubscriptionExpiredPoolOwnerEmailContext;
    }
  | {
      template: 'unsubscribed-receipt';
      context: UnsubscribedReceiptEmailContext;
    }
  | {
      template: 'unsubscribed-pool-owner-notice';
      context: UnsubscribedPoolOwnerNoticeEmailContext;
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
