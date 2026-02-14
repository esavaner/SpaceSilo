import type { Role } from '../prisma/generated/client';

export type TokenType = 'access' | 'refresh';

export type TokenClaims = {
  sub: string;
  email: string;
  role: Role;
};

export type TokenPayload = TokenClaims & {
  typ: TokenType;
  iat?: number;
  exp?: number;
};
