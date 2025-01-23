import { Controller, Get, Post, Body, Patch, Param, Delete, Req } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { AddMemberDto, AddMembersDto, CreateGroupDto, RemoveMemberDto, UpdateMemberDto } from 'src/_dto/group.dto';
import { ApiOkResponse, ApiProperty, ApiTags } from '@nestjs/swagger';
import { PrismaModel } from 'src/_gen/prisma-class';

class WithMembers extends PrismaModel.Group {
  @ApiProperty({ isArray: true, type: () => PrismaModel.GroupMember })
  members: PrismaModel.GroupMember[];
}

@ApiTags('groups')
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  @ApiOkResponse({ type: WithMembers })
  create(@Body() dto: CreateGroupDto, @Req() request: Request) {
    return this.groupsService.create(dto, request['user']);
  }

  @Patch(':id/add_member')
  @ApiOkResponse({ type: WithMembers })
  addMember(@Param('id') id: string, @Body() dto: AddMemberDto) {
    return this.groupsService.addMember(id, dto);
  }

  @Patch(':id/add_members')
  @ApiOkResponse({ type: WithMembers })
  addMembers(@Param('id') id: string, @Body() dto: AddMembersDto) {
    return this.groupsService.addMembers(id, dto);
  }

  @Patch(':id/remove_member')
  @ApiOkResponse({ type: WithMembers })
  removeMember(@Param('id') id: string, @Body() dto: RemoveMemberDto) {
    return this.groupsService.removeMember(id, dto);
  }

  @Patch(':id/update_member')
  @ApiOkResponse({ type: WithMembers })
  updateMember(@Param('id') id: string, @Body() dto: UpdateMemberDto) {
    return this.groupsService.updateMember(id, dto);
  }

  @Get()
  @ApiOkResponse({ type: WithMembers, isArray: true })
  findAll() {
    return this.groupsService.findAll();
  }

  @Get(':id')
  @ApiOkResponse({ type: WithMembers })
  findOne(@Param('id') id: string) {
    return this.groupsService.findOne(id);
  }

  @Delete(':id')
  @ApiOkResponse({ type: WithMembers })
  remove(@Param('id') id: string) {
    return this.groupsService.remove(id);
  }
}
