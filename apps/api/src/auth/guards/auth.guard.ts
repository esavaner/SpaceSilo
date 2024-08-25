import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthType } from "../decorators/auth.decorator";
import { AccessGuard } from "./access.guard";

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly defaultAuthType = AuthType.Bearer;
  private readonly authTypeMap: Record<AuthType, CanActivate> = {
    [AuthType.Bearer]: this.accessGuard,
    [AuthType.None]: { canActivate: () => true },
  };

  constructor(
    private readonly reflector: Reflector,
    private readonly accessGuard: AccessGuard
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const authTypes = this.reflector.getAllAndOverride<AuthType[]>("authType", [
      context.getHandler(),
      context.getClass(),
    ]) ?? [this.defaultAuthType];
    const guards = authTypes.map((type) => this.authTypeMap[type]).flat();
    let error = new UnauthorizedException();

    for (const instance of guards) {
      const canActivate = await Promise.resolve(
        instance.canActivate(context)
      ).catch((err) => {
        error = err;
      });

      if (canActivate) {
        return true;
      }
    }
    throw error;
  }
}
