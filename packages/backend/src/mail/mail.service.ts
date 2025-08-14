import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

export interface EmailVerification {
  code: string;
  name: string;
  expiresIn: string;
}

export interface NotificationContext {
  actorImage: string;
  actorDisplayName: string;
  name: string;
  notificationMessage: string;
  actionUrl: string;
  notificationsSettingsUrl: string;
}

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

@Injectable()
export class MailService {
  constructor(
    private readonly mail: MailerService,
    private readonly configService: ConfigService,
  ) {}

  sendEmailVerification(
    to: string,
    context: EmailVerification,
  ): Promise<MailResponse> {
    const appFrontendUrl = this.configService.get<string>(
      'APP_FRONTEND_URL',
    ) as string;
    return this.mail.sendMail({
      template: 'verification-email',
      subject: 'Email Verification',
      to,
      context: {
        name: context.name,
        expiresIn: context.expiresIn,
        verificationCode: context.code,
        verificationUrl: `${appFrontendUrl}/verify-email?code=${context.code}`,
      },
    });
  }

  sendNotification(to: string, context: NotificationContext) {
    return this.mail.sendMail({
      template: 'notification',
      subject: `New notification from ${context.actorDisplayName}`,
      to,
      context,
    });
  }
}
