import { IsArray, IsDate, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { Prisma, Role } from '../prisma/generated/client';

/* ------------------------- Requests -------------------------- */

export class CreateUserRequest {
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

  @IsOptional()
  settings?: Prisma.JsonValue | null;
}

export class UpdateUserRequest {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  password?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  settings?: Prisma.JsonValue | null;
}

/* ------------------------- Responses ------------------------- */

export class UserResponse {
  @IsString()
  id!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  name?: string | null;

  @IsEnum(Role)
  role!: Role;

  @IsDate()
  createdAt!: Date;

  @IsDate()
  updatedAt!: Date;

  @IsOptional()
  @IsDate()
  deletedAt?: Date | null;

  @IsOptional()
  settings?: Prisma.JsonValue | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photoIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  albumIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ownerGroupIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  memberGroupIds?: string[];
}
