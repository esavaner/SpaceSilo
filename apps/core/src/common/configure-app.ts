import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { API_PREFIX } from '@repo/shared/constants/api';
import { HttpExceptionFilter } from './http-exception.filter';

export function configureApp(app: INestApplication) {
  app.setGlobalPrefix(API_PREFIX);
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      // whitelist: true,
      // forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );
  app.enableCors({
    origin: 'http://localhost:8081', // @TODO
  });
}
