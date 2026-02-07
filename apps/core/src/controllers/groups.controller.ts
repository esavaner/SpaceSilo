import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { GroupsService } from '@/services/groups.service';
import {
  AddGroupMemberRequest,
  AddGroupMembersRequest,
  CreateGroupRequest,
  GroupResponse,
  RemoveGroupMemberRequest,
  UpdateGroupMemberRequest,
} from '@repo/shared';
import { type TokenPayload } from '@/common/types';
import { User } from '@/decorators/user.decorator';
import { Roles } from '@/decorators/roles.decorator';

@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  create(@Body() dto: CreateGroupRequest, @User() user: TokenPayload): Promise<GroupResponse> {
    return this.groupsService.create(dto, user.sub);
  }

  @Patch(':id/add_member')
  addMember(@Param('id') id: string, @Body() dto: AddGroupMemberRequest): Promise<GroupResponse> {
    return this.groupsService.addMember(id, dto);
  }

  @Patch(':id/add_members')
  addMembers(@Param('id') id: string, @Body() dto: AddGroupMembersRequest): Promise<GroupResponse> {
    return this.groupsService.addMembers(id, dto);
  }

  @Patch(':id/remove_member')
  removeMember(@Param('id') id: string, @Body() dto: RemoveGroupMemberRequest): Promise<GroupResponse> {
    return this.groupsService.removeMember(id, dto);
  }

  @Patch(':id/update_member')
  updateMember(@Param('id') id: string, @Body() dto: UpdateGroupMemberRequest): Promise<GroupResponse> {
    return this.groupsService.updateMember(id, dto);
  }

  @Get()
  findUserGroups(@User() user: TokenPayload): Promise<GroupResponse[]> {
    return this.groupsService.findUserGroups(user);
  }

  @Get('/all')
  @Roles('admin', 'owner')
  findAll(@User() user: TokenPayload): Promise<GroupResponse[]> {
    return this.groupsService.findAll(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<GroupResponse> {
    return this.groupsService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<GroupResponse> {
    return this.groupsService.remove(id);
  }
}
