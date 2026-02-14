import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { type TokenPayload } from '@repo/shared';

export const User = createParamDecorator((_: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.user as TokenPayload;
});
