import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import {
  CreateUserRequest,
  type TokenPayload,
  UpdateUserRequest,
  type UserResponse,
  type UserSearchResponse,
} from '@repo/shared';
import { Roles } from '@/decorators/roles.decorator';
import { User } from '@/decorators/user.decorator';
import { UsersService } from '@/services/users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles('owner', 'admin')
  create(@Body() dto: CreateUserRequest, @User() caller: TokenPayload): Promise<UserResponse> {
    return this.usersService.create(dto, caller);
  }

  @Get()
  @Roles('owner', 'admin')
  findAll(): Promise<UserResponse[]> {
    return this.usersService.findAll();
  }

  @Get('search/:query')
  search(@Param('query') query: string): Promise<UserSearchResponse[]> {
    return this.usersService.search(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @User() caller: TokenPayload): Promise<UserResponse> {
    return this.usersService.findOne(id, caller);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserRequest, @User() caller: TokenPayload): Promise<UserResponse> {
    return this.usersService.update(id, dto, caller);
  }

  @Delete(':id')
  @Roles('owner', 'admin')
  remove(@Param('id') id: string, @User() caller: TokenPayload): Promise<UserResponse> {
    return this.usersService.remove(id, caller);
  }
}
