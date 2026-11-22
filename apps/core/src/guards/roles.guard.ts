import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { type Role, type TokenPayload } from '@repo/shared';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const roles = this.reflector?.getAllAndOverride<Role[]>('roles', [context.getHandler(), context.getClass()]);
    if (!roles) {
      return true;
    }
    const user = context.switchToHttp().getRequest().user as TokenPayload | undefined;
    return Boolean(user && roles.includes(user.role));
  }
}
