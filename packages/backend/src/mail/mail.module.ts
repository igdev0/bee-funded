import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Handlebars from 'handlebars';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import mailConfig from './mail.config';
import { formatAmount, formatDate, globalVar } from './mail.helpers';

Handlebars.registerHelper('formatAmount', formatAmount);
Handlebars.registerHelper('formatDate', formatDate);
Handlebars.registerHelper('global', globalVar);

const mod = MailerModule.forRootAsync({
  imports: [ConfigModule.forFeature(mailConfig)],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => ({
    transport:
      configService.get('NODE_ENV') === 'production'
        ? {
            host: configService.get<string>('mail.transport.host'),
            port: configService.get<number>('mail.transport.port'),
            secure: configService.get<boolean>('mail.transport.secure'),
            ignoreTLS: configService.get<boolean>('mail.transport.ignoreTLS'),
            auth: {
              user: configService.get<string>('mail.transport.auth.user'),
              pass: configService.get<string>('mail.transport.auth.pass'),
            },
          }
        : { jsonTransport: true },
    defaults: {
      from: configService.get('mail.defaults.from'),
    },
    template: {
      dir: `${configService.get('mail.template.dir')}`,
      adapter: new HandlebarsAdapter(),
      options: {
        strict: true,
      },
    },
    preview: configService.get<boolean>('mail.preview'),
  }),
});

@Module({
  imports: [ConfigModule.forRoot(), mod],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
