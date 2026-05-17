import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('RequestLogger');

  use(req: Request, res: Response, next: NextFunction) {
    const requestId = crypto.randomUUID().slice(0, 8);
    (req as any).requestId = requestId;

    const start = Date.now();
    const { method, originalUrl } = req;

    this.logger.log(`→ ${method} ${originalUrl} [${requestId}]`);

    res.on('finish', () => {
      const duration = Date.now() - start;
      const { statusCode } = res;

      const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'log';

      this.logger[level](
        `← ${method} ${originalUrl} ${statusCode} ${duration}ms [${requestId}]`,
      );
    });

    next();
  }
}
