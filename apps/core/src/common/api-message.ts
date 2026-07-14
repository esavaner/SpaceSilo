import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpStatus,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

export const Err = {
  BadRequest: (message: string) => new BadRequestException(message),
  Unauthorized: (message: string) => new UnauthorizedException(message),
  Forbidden: (message: string) => new ForbiddenException(message),
  NotFound: (message: string) => new NotFoundException(message),
  Conflict: (message: string) => new ConflictException(message),
};

export const defaultMessageByStatus: Partial<Record<HttpStatus, string>> = {
  [HttpStatus.BAD_REQUEST]: 'api.common.Err.BadRequest',
  [HttpStatus.UNAUTHORIZED]: 'api.common.unauthorized',
  [HttpStatus.FORBIDDEN]: 'api.common.forbidden',
  [HttpStatus.NOT_FOUND]: 'api.common.Err.NotFound',
  [HttpStatus.CONFLICT]: 'api.common.conflict',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'api.common.internalServerError',
};
