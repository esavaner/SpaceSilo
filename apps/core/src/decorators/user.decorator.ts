import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TokenPayload } from 'src/common/types';

export const User = createParamDecorator((_: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.user as TokenPayload;
});
