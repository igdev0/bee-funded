import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import mailConfig from './mail.config';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule.forFeature(mailConfig)],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('mail.transport.host'),
          port: configService.get<number>('mail.transport.port'),
          secure: configService.get<boolean>('mail.transport.secure'),
          ignoreTLS: configService.get<boolean>('mail.transport.ignoreTLS'),
          auth: {
            user: configService.get<string>('mail.transport.auth.user'),
            pass: configService.get<string>('mail.transport.auth.pass'),
          },
        },
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
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
