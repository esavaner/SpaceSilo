import { SetMetadata } from "@nestjs/common";

export enum AuthType {
  Bearer,
  None,
}

export const Auth = (...authTypes: AuthType[]) =>
  SetMetadata("authType", authTypes);
