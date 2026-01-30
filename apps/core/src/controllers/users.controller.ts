import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CreateUserDto, GetUserDto, SearchUserDto, UpdateUserDto } from '@/_dto/user.dto.js';
import { UsersService } from '@/services/users.service.js';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOkResponse({ type: GetUserDto })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get()
  @ApiOkResponse({ type: GetUserDto, isArray: true })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOkResponse({ type: GetUserDto })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Get('search/:query')
  @ApiOkResponse({ type: SearchUserDto, isArray: true })
  search(@Param('query') query: string) {
    return this.usersService.search(query);
  }

  @Patch(':id')
  @ApiOkResponse({ type: SearchUserDto })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @ApiOkResponse({ type: SearchUserDto })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
