import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
// import { type Role } from '@/prisma/prisma';
import { TokenPayload } from '@/common/types';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const roles = this.reflector?.getAllAndOverride<any[]>('roles', [context.getHandler(), context.getClass()]);
    if (!roles) {
      return true;
    }
    const user = context.switchToHttp().getRequest().user as TokenPayload;
    return roles.some((role) => user.role === role);
  }
}
