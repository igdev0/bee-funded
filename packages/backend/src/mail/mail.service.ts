import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import {
  Context,
  EmailVerificationContext,
  EmailVerificationContextPayload,
  NotificationMailContext,
  SendMailPayload,
} from './mail.interface';

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

  sendMail<C extends Context>(payload: SendMailPayload<C>) {
    if (this.configService.get<string>('NODE_ENV') === 'test') {
      return true;
    }
    return this.mail.sendMail({
      template: payload.template,
      subject: payload.subject,
      to: payload.to,
      context: payload.context,
    });
  }

  sendVerificationEmail(to: string, context: EmailVerificationContext) {
    return this.sendMail<EmailVerificationContextPayload>({
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
