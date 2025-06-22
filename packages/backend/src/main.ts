import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe());
  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigins = ['http://localhost:3000', 'http://localhost:5173'];
      if (!origin || allowedOrigins.includes(origin)) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        callback(null, true);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: 'GET,POST,PUT,DELETE,PATCH', // Allow HTTP methods
    credentials: true, // Allow cookies to be sent
    allowedHeaders: 'Content-Type, Authorization', // Permitted request headers
  });
  // Demo
  // setInterval(() => {
  //   app
  //     .get(NotificationsService)
  //     .sendToUser('384a49d6-615d-4409-953e-b054f0d7d547', {
  //       type: 'TEST',
  //       data: {
  //         name: 'Some name',
  //         message: 'This is a test message',
  //       },
  //     });
  // }, 1000);
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
