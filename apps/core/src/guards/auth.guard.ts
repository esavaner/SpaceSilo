import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthType } from '../decorators/auth.decorator';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { type TokenPayload } from '@repo/shared';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly authTypeMap: Record<AuthType, CanActivate>;

  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService
  ) {
    this.authTypeMap = {
      [AuthType.Bearer]: {
        canActivate: async (context: ExecutionContext): Promise<boolean> => {
          const request = context.switchToHttp().getRequest<Request>();
          const authHeader = request.headers['authorization'];
          const bearer = typeof authHeader === 'string' ? authHeader : Array.isArray(authHeader) ? authHeader[0] : '';
          const token = bearer?.toLowerCase().startsWith('bearer ') ? bearer.slice(7) : null;

          if (!token) {
            throw new UnauthorizedException();
          }
          try {
            const payload = this.jwtService.verify<TokenPayload>(token);
            if (payload.typ !== 'access') {
              throw new UnauthorizedException();
            }
            request['user'] = payload;
          } catch {
            throw new UnauthorizedException();
          }
          return true;
        },
      },
      [AuthType.None]: { canActivate: () => true },
    };
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const authTypes = this.reflector?.getAllAndOverride<AuthType[]>('authType', [
      context.getHandler(),
      context.getClass(),
    ]) ?? [AuthType.Bearer];
    const guards = authTypes.map((type) => this.authTypeMap[type]).flat();
    let error = new UnauthorizedException();

    for (const instance of guards) {
      const canActivate = await Promise.resolve(instance?.canActivate(context)).catch((err) => {
        error = err;
      });

      if (canActivate) {
        return true;
      }
    }
    throw error;
  }
}
