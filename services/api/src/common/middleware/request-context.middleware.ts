import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { requestContext } from '../logging/request-context';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    const traceId = (req.headers['x-trace-id'] as string) ?? randomUUID();
    requestContext.run({ traceId }, () => next());
  }
}
