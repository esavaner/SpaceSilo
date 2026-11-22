import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { API_PREFIX } from '@repo/shared/constants/api';
import { environment, parseCorsOrigins } from './env.validation';
import { HttpExceptionFilter } from './http-exception.filter';

export function configureApp(app: INestApplication) {
  app.setGlobalPrefix(API_PREFIX);
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );
  const corsOrigins = environment?.corsOrigins ?? parseCorsOrigins(process.env.CORS_ORIGINS);
  app.enableCors({
    origin: corsOrigins.length === 0 ? false : corsOrigins.includes('*') ? '*' : [...corsOrigins],
  });
}
