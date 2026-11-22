import { IsEmail, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

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
