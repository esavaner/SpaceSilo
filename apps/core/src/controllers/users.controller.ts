import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CreateUserRequest, UpdateUserRequest, UserResponse } from '@repo/shared';
import { UsersService } from '@/services/users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() dto: CreateUserRequest): Promise<UserResponse> {
    return this.usersService.create(dto);
  }

  @Get()
  findAll(): Promise<UserResponse[]> {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<UserResponse> {
    return this.usersService.findOne(id);
  }

  @Get('search/:query')
  search(@Param('query') query: string): Promise<UserResponse[]> {
    return this.usersService.search(query);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserRequest): Promise<UserResponse> {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<UserResponse> {
    return this.usersService.remove(id);
  }
}
