import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());

  const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: function (origin, callback) {
      // origin'siz istekler (curl, sağlık kontrolü) ve allow-list'teki origin'ler kabul edilir.
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
        return;
      }
      callback(new Error('CORS: izin verilmeyen origin — ' + origin));
    },
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'X-Admin-Api-Key']
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    })
  );

  const port = process.env.BACKEND_PORT ? Number(process.env.BACKEND_PORT) : 3001;
  await app.listen(port);

  // eslint-disable-next-line no-console
  console.log(`[Paketçi Destek Backend] ${process.env.APP_NAME || 'API'} http://localhost:${port}/api üzerinde çalışıyor.`);
}

bootstrap();
