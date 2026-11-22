import { Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const startedAt = process.hrtime.bigint();
    const { method } = req;
    const path = req.originalUrl.split('?')[0];
    const auth = req.get('authorization') ? ' authorization=[REDACTED]' : '';

    res.on('finish', () => {
      const durationMs = Math.round(Number(process.hrtime.bigint() - startedAt) / 1_000_000);
      this.logger.log(`${method} ${path} ${res.statusCode} ${durationMs}ms${auth}`);
    });

    next();
  }
}
