import { PartialType } from '@nestjs/swagger';

export class CreateUserDto {
  name: string;
  email: string;
  password: string;
  role: string;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {}
