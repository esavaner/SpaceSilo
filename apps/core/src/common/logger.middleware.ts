import type { NestMiddleware } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { ip, method, originalUrl, body } = req;
    const userAgent = req.get('user-agent') || '';

    this.logger.log(`Request: ${method} ${originalUrl} - ${JSON.stringify(body)} - ${userAgent} ${ip}`);

    const oldWrite = res.write;
    const oldEnd = res.end;
    const chunks: any[] = [];

    res.write = (...restArgs: any[]) => {
      chunks.push(Buffer.from(restArgs[0]));
      return oldWrite.apply(res, restArgs);
    };

    res.end = (...restArgs: any[]) => {
      if (restArgs[0]) {
        chunks.push(Buffer.from(restArgs[0]));
      }
      const body = Buffer.concat(chunks).toString('utf8');
      // this.logger.log(`Response: ${method} ${originalUrl} - ${res.statusCode} - ${body}`);
      this.logger.log(`Response: ${method} ${originalUrl} - ${res.statusCode}`);
      return oldEnd.apply(res, restArgs);
    };

    next();
  }
}
