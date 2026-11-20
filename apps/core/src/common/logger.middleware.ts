import { Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

type ResponseChunk = Parameters<Response['write']>[0];

export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { ip, method, originalUrl, body } = req;
    const userAgent = req.get('user-agent') || '';

    this.logger.log(`Request: ${method} ${originalUrl} - ${JSON.stringify(body)} - ${userAgent} ${ip}`);

    const oldWrite = res.write;
    const oldEnd = res.end;
    const chunks: Buffer[] = [];

    res.write = (
      chunk: ResponseChunk,
      encodingOrCallback?: BufferEncoding | ((error?: Error | null) => void),
      callback?: (error?: Error | null) => void
    ) => {
      chunks.push(Buffer.from(chunk));
      const encoding = typeof encodingOrCallback === 'string' ? encodingOrCallback : 'utf8';
      const writeCallback = typeof encodingOrCallback === 'function' ? encodingOrCallback : callback;
      return oldWrite.call(res, chunk, encoding, writeCallback);
    };

    res.end = (chunk?: ResponseChunk, encodingOrCallback?: BufferEncoding | (() => void), callback?: () => void) => {
      if (chunk !== undefined && typeof chunk !== 'function') {
        chunks.push(Buffer.from(chunk));
      }
      const body = Buffer.concat(chunks).toString('utf8');
      // this.logger.log(`Response: ${method} ${originalUrl} - ${res.statusCode} - ${body}`);
      this.logger.log(`Response: ${method} ${originalUrl} - ${res.statusCode}`);
      if (typeof chunk === 'function') {
        callback = chunk;
        chunk = undefined;
      }
      const encoding = typeof encodingOrCallback === 'string' ? encodingOrCallback : 'utf8';
      const endCallback = typeof encodingOrCallback === 'function' ? encodingOrCallback : callback;
      return oldEnd.call(res, chunk, encoding, endCallback);
    };

    next();
  }
}
