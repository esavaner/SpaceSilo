import { SetMetadata } from "@nestjs/common";

export type Role = "admin" | "user";

export const Roles = (...roles: Role[]) => SetMetadata("roles", roles);
