import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { Role } from '../prisma/generated/client';
import { UserResponse } from './user.dto';

/* ------------------------- Requests -------------------------- */

export class LoginRequest {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class RegisterRequest {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsString()
  @IsNotEmpty()
  groupId!: string;
}

export class RefreshRequest {
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

/* ------------------------- Responses ------------------------- */

export class AuthResponse {
  @IsString()
  @IsNotEmpty()
  accessToken!: string;

  @IsString()
  @IsNotEmpty()
  refreshToken!: string;

  @ValidateNested()
  @Type(() => UserResponse)
  user!: UserResponse;
}

export class RefreshResponse {
  @IsString()
  @IsNotEmpty()
  accessToken!: string;

  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}
