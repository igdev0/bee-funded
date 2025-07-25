import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import mailConfig from './mail.config';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';

describe('MailService', () => {
  let module: TestingModule;
  let service: MailService;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        await ConfigModule.forRoot({
          envFilePath: '.env.test.local',
        }),
        MailerModule.forRootAsync({
          imports: [
            await ConfigModule.forRoot({
              envFilePath: '.env.test.local',
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
      expiresIn: '5 minutes',
    });
    expect(response.envelope.to).toEqual(['test@gmail.com']);
    expect(response.envelope.from).toEqual('noreply@dorultanianos.dev');
  });
});
