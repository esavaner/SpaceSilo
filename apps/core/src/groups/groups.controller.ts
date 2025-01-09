import { Controller, Get, Post, Body, Patch, Param, Delete, Req } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { AddMemberDto, CreateGroupDto, RemoveMemberDto, UpdateMemberDto } from 'src/_dto/group.dto';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { GroupEntity } from 'src/_entity/group.entity';

@ApiTags('groups')
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  @ApiOkResponse({ type: GroupEntity })
  create(@Body() dto: CreateGroupDto, @Req() request: Request) {
    return this.groupsService.create(dto, request['user']);
  }

  @Patch(':id/add_member')
  @ApiOkResponse({ type: GroupEntity })
  addMember(@Param('id') id: string, @Body() dto: AddMemberDto) {
    return this.groupsService.addMember(id, dto);
  }

  @Patch(':id/remove_member')
  @ApiOkResponse({ type: GroupEntity })
  removeMember(@Param('id') id: string, @Body() dto: RemoveMemberDto) {
    return this.groupsService.removeMember(id, dto);
  }

  @Patch(':id/update_member')
  @ApiOkResponse({ type: GroupEntity })
  updateMember(@Param('id') id: string, @Body() dto: UpdateMemberDto) {
    return this.groupsService.updateMember(id, dto);
  }

  @Get()
  @ApiOkResponse({ type: GroupEntity, isArray: true })
  findAll() {
    return this.groupsService.findAll();
  }

  @Get(':id')
  @ApiOkResponse({ type: GroupEntity })
  findOne(@Param('id') id: string) {
    return this.groupsService.findOne(id);
  }

  @Delete(':id')
  @ApiOkResponse({ type: GroupEntity })
  remove(@Param('id') id: string) {
    return this.groupsService.remove(id);
  }
}
