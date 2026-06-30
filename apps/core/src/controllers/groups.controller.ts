import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { GroupsService } from '@/services/groups.service';
import {
  AddGroupMemberRequest,
  AddGroupMembersRequest,
  CreateGroupRequest,
  GroupResponse,
  RemoveGroupMemberRequest,
  UpdateGroupRequest,
  UpdateGroupMemberRequest,
} from '@repo/shared';
import { type TokenPayload } from '@repo/shared';
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
  addMember(
    @Param('id') id: string,
    @Body() dto: AddGroupMemberRequest,
    @User() user: TokenPayload
  ): Promise<GroupResponse> {
    return this.groupsService.addMember(id, dto, user);
  }

  @Patch(':id/add_members')
  addMembers(
    @Param('id') id: string,
    @Body() dto: AddGroupMembersRequest,
    @User() user: TokenPayload
  ): Promise<GroupResponse> {
    return this.groupsService.addMembers(id, dto, user);
  }

  @Patch(':id/remove_member')
  removeMember(
    @Param('id') id: string,
    @Body() dto: RemoveGroupMemberRequest,
    @User() user: TokenPayload
  ): Promise<GroupResponse> {
    return this.groupsService.removeMember(id, dto, user);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateGroupRequest, @User() user: TokenPayload): Promise<GroupResponse> {
    return this.groupsService.update(id, dto, user);
  }

  @Patch(':id/update_member')
  updateMember(
    @Param('id') id: string,
    @Body() dto: UpdateGroupMemberRequest,
    @User() user: TokenPayload
  ): Promise<GroupResponse> {
    return this.groupsService.updateMember(id, dto, user);
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
  findOne(@Param('id') id: string, @User() user: TokenPayload): Promise<GroupResponse> {
    return this.groupsService.findOne(id, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @User() user: TokenPayload): Promise<GroupResponse> {
    return this.groupsService.remove(id, user);
  }
}
