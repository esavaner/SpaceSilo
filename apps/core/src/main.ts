import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { HttpExceptionFilter } from './common/http-exception.filter.js';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
// import { PrismaModel } from './_gen/prisma-class';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
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
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const cookieParser = require('cookie-parser');
  app.use(cookieParser());
  app.enableCors({
    origin: 'http://localhost:8081', // @TODO
    credentials: true,
    exposedHeaders: ['Set-Cookie'],
  });

  const config = new DocumentBuilder()
    .setTitle('HomeSilo API')
    .setDescription('The API description')
    .setVersion('1.0')
    .build();
  // const document = SwaggerModule.createDocument(app, config, { extraModels: [...PrismaModel.extraModels] });
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    jsonDocumentUrl: 'api/json',
  });

  await app.listen(3100);
}
bootstrap();
