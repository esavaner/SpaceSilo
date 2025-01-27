import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { GroupsService } from 'src/services/groups.service';
import {
  AddMemberDto,
  AddMembersDto,
  CreateGroupDto,
  GetGroupDto,
  RemoveMemberDto,
  UpdateMemberDto,
} from 'src/_dto/group.dto';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { TokenPayload } from 'src/common/types';
import { User } from 'src/decorators/user.decorator';

@ApiTags('groups')
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  @ApiOkResponse({ type: GetGroupDto })
  create(@Body() dto: CreateGroupDto, @User() user: TokenPayload) {
    return this.groupsService.create(dto, user);
  }

  @Patch(':id/add_member')
  @ApiOkResponse({ type: GetGroupDto })
  addMember(@Param('id') id: string, @Body() dto: AddMemberDto) {
    return this.groupsService.addMember(id, dto);
  }

  @Patch(':id/add_members')
  @ApiOkResponse({ type: GetGroupDto })
  addMembers(@Param('id') id: string, @Body() dto: AddMembersDto) {
    return this.groupsService.addMembers(id, dto);
  }

  @Patch(':id/remove_member')
  @ApiOkResponse({ type: GetGroupDto })
  removeMember(@Param('id') id: string, @Body() dto: RemoveMemberDto) {
    return this.groupsService.removeMember(id, dto);
  }

  @Patch(':id/update_member')
  @ApiOkResponse({ type: GetGroupDto })
  updateMember(@Param('id') id: string, @Body() dto: UpdateMemberDto) {
    return this.groupsService.updateMember(id, dto);
  }

  @Get()
  @ApiOkResponse({ type: GetGroupDto, isArray: true })
  findAll() {
    return this.groupsService.findAll();
  }

  @Get(':id')
  @ApiOkResponse({ type: GetGroupDto })
  findOne(@Param('id') id: string) {
    return this.groupsService.findOne(id);
  }

  @Delete(':id')
  @ApiOkResponse({ type: GetGroupDto })
  remove(@Param('id') id: string) {
    return this.groupsService.remove(id);
  }
}
