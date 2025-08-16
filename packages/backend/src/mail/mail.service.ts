import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import {
  EmailVerification,
  MailResponse,
  NotificationMailContext,
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

  sendEmailVerification(
    to: string,
    context: EmailVerification,
  ): Promise<MailResponse> {
    return this.mail.sendMail({
      template: 'verification-email',
      subject: 'Email Verification',
      to,
      context: {
        name: context.name,
        expiresIn: context.expiresIn,
        verificationCode: context.code,
        verificationUrl: `${this.appFrontendUrl}/verify-email?code=${context.code}`,
      },
    });
  }

  sendNotification(to: string, context: NotificationMailContext) {
    return this.mail.sendMail({
      template: 'notification',
      subject: `New notification from ${context.actorDisplayName}`,
      to,
      context: {
        ...context,
        notificationsSettingsPath: `${this.appFrontendUrl}${context.notificationsSettingsPath}`,
        actionUrl: `${this.appFrontendUrl}${context.actionPath}`,
      },
    });
  }
}
