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

/* ------------------------- Responses ------------------------- */

export class AuthResponse {
  @IsString()
  @IsNotEmpty()
  access_token!: string;

  @ValidateNested()
  @Type(() => UserResponse)
  user!: UserResponse;
}
