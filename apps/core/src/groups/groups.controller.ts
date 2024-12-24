import { Controller, Get, Post, Body, Patch, Param, Delete, Req } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { AddMemberDto, CreateGroupDto, RemoveMemberDto, UpdateMemberDto } from 'src/_dto/group.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('groups')
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  create(@Body() dto: CreateGroupDto, @Req() request: Request) {
    return this.groupsService.create(dto, request['user']);
  }

  @Patch(':id/add_member')
  addMember(@Param('id') id: string, @Body() dto: AddMemberDto) {
    return this.groupsService.addMember(id, dto);
  }

  @Patch(':id/remove_member')
  removeMember(@Param('id') id: string, @Body() dto: RemoveMemberDto) {
    return this.groupsService.removeMember(id, dto);
  }

  @Patch(':id/update_member')
  updateMember(@Param('id') id: string, @Body() dto: UpdateMemberDto) {
    return this.groupsService.updateMember(id, dto);
  }

  @Get()
  findAll() {
    return this.groupsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.groupsService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.groupsService.remove(id);
  }
}
