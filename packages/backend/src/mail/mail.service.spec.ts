import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import mailConfig from './mail.config';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import * as process from 'node:process';

describe('MailService', () => {
  let module: TestingModule;
  let service: MailService;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath:
            process.env.NODE_ENV === 'test' ? '.env.test.local' : '.env',
        }),
        MailerModule.forRootAsync({
          imports: [
            ConfigModule.forRoot({
              envFilePath:
                process.env.NODE_ENV === 'test' ? '.env.test.local' : '.env',
            }),
            ConfigModule.forFeature(mailConfig),
          ],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            transport:
              configService.get('NODE_ENV') === 'production'
                ? {
                    host: configService.get<string>('mail.transport.host'),
                    port: configService.get<number>('mail.transport.port'),
                    secure: configService.get<boolean>('mail.transport.secure'),
                    ignoreTLS: configService.get<boolean>(
                      'mail.transport.ignoreTLS',
                    ),
                    auth: {
                      user: configService.get<string>(
                        'mail.transport.auth.user',
                      ),
                      pass: configService.get<string>(
                        'mail.transport.auth.pass',
                      ),
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
          }),
        }),
      ],
      providers: [MailService],
    }).compile();
    service = module.get<MailService>(MailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should be able to send a verification email', async () => {
    const response = await service.sendEmailVerification('test@gmail.com', {
      code: '0x0d03',
      name: 'Ianos',
    });

    console.log(response);
    expect(response.envelope.to).toEqual(['test@gmail.com']);
    expect(response.envelope.from).toEqual('noreply@dorultanianos.dev');

    module.get(ConfigService).get('APP');
  });
});
