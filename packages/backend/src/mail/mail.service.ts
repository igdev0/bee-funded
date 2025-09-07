import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import {
  EmailVerificationContext,
  NotificationMailContext,
  SendMailPayload,
} from './mail.interface';

// @todo – Create a helper for formating the verificationUrl, rather than a method on this service.
// @todo – Create a helper for formatting notificationSettingsUrl and one for actionUrl, rather than a method "sendNotification" on this service.
@Injectable()
export class MailService {
  private appFrontendUrl: string;

  constructor(
    private readonly mail: MailerService,
    private readonly configService: ConfigService,
  ) {
    this.appFrontendUrl = this.configService.get<string>(
      'APP_FRONTEND_URL',
    ) as string;
  }

  sendMail(payload: SendMailPayload) {
    if (this.configService.get<string>('NODE_ENV') === 'test') {
      return {
        envelope: { to: [payload.to] },
      };
    }
    return this.mail.sendMail({
      template: payload.template,
      subject: payload.subject,
      to: payload.to,
      context: { ...payload.context, year: new Date().getFullYear() },
    });
  }

  sendVerificationEmail(to: string, context: EmailVerificationContext) {
    return this.sendMail({
      template: 'email-verification',
      subject: 'Verify your email',
      to,
      context: {
        ...context,

        verificationUrl: `${this.appFrontendUrl}/verify-email?code=${context.code}`,
      },
    });
  }

  sendNotification(to: string, context: NotificationMailContext) {
    return this.sendMail({
      template: 'notification',
      subject: `New notification from ${context.actorDisplayName}`,
      to,
      context: {
        ...context,
        notificationsSettingsUrl: `${this.appFrontendUrl}${context.notificationsSettingsPath}`,
        actionUrl: `${this.appFrontendUrl}${context.actionPath}`,
      },
    });
  }
}
