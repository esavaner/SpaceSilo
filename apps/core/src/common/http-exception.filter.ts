import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { defaultMessageByStatus } from './api-message';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    const exceptionResponse = exception.getResponse();
    const isObject = typeof exceptionResponse === 'object' && exceptionResponse !== null;
    const responseBody = isObject ? (exceptionResponse as Record<string, unknown>) : undefined;
    const message =
      typeof responseBody?.message === 'string'
        ? responseBody.message
        : (defaultMessageByStatus[status as HttpStatus] ?? 'api.common.internalServerError');

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}
