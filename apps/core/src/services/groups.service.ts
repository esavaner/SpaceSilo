import { Injectable } from '@nestjs/common';
import {
  AddGroupMemberRequest,
  AddGroupMembersRequest,
  CreateGroupRequest,
  GroupResponse,
  RemoveGroupMemberRequest,
  UpdateGroupRequest,
  UpdateGroupMemberRequest,
} from '@repo/shared';
import { PrismaService } from '@/common/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import { type TokenPayload } from '@repo/shared';
import { Err } from '@/common/api-message';
import { environment } from '@/common/env.validation';

@Injectable()
export class GroupsService {
  private readonly options = {
    include: {
      members: {
        include: {
          user: {
            select: { id: true, email: true, name: true, role: true, createdAt: true, updatedAt: true, settings: true },
          },
        },
      },
    },
  };

  constructor(private readonly prisma: PrismaService) {}

  private verifyGroupAccess(group: { ownerId: string; members: readonly unknown[] }, user: TokenPayload) {
    const isOwner = group.ownerId === user.sub;
    const isMember = group.members.length > 0;
    const isAdmin = user.role === 'admin';

    if (!isOwner && !isMember && !isAdmin) {
      throw Err.Unauthorized('api.groups.accessDenied');
    }
  }

  async assertGroupAccess(groupId: string, user: TokenPayload) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      select: {
        id: true,
        ownerId: true,
        members: {
          where: { userId: user.sub },
          select: { userId: true },
        },
      },
    });

    if (!group) {
      throw Err.NotFound('api.groups.Err.NotFound');
    }

    this.verifyGroupAccess(group, user);
    return group;
  }

  async findFileInfoGroup(groupId: string, user: TokenPayload) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      select: {
        id: true,
        name: true,
        personal: true,
        ownerId: true,
        owner: {
          select: { id: true, email: true, name: true },
        },
        members: {
          where: { userId: user.sub },
          select: { access: true },
        },
      },
    });

    if (!group) {
      throw Err.NotFound('api.groups.Err.NotFound');
    }

    this.verifyGroupAccess(group, user);
    return {
      id: group.id,
      name: group.name,
      personal: group.personal,
      owner: group.owner,
      access: group.ownerId === user.sub ? 'owner' : group.members[0]?.access,
    };
  }

  private async assertGroupOwner(groupId: string, user: TokenPayload) {
    const group = await this.assertGroupAccess(groupId, user);
    const isOwner = group.ownerId === user.sub;
    const isAdmin = user.role === 'admin';

    if (!isOwner && !isAdmin) {
      throw Err.Forbidden('api.groups.ownerRequired');
    }

    return group;
  }

  async findGroupMember(groupId: string, user: TokenPayload) {
    const member = await this.prisma.groupMember.findFirst({
      // find a group by id where the user is a member or the owner
      where: {
        groupId,
        OR: [{ group: { members: { some: { userId: user.sub } } } }, { group: { ownerId: user.sub } }],
      },
      include: {
        group: true,
      },
    });
    return member;
  }

  async create(dto: CreateGroupRequest, userId: string): Promise<GroupResponse> {
    const existingGroup = await this.prisma.group.findUnique({ where: { id: dto.id } });

    if (existingGroup) {
      throw Err.Forbidden('api.groups.duplicateId');
    }

    const res = await this.prisma.group.create({
      data: {
        ownerId: userId,
        name: dto.name,
        id: dto.id,
        personal: dto.personal,
        color: dto.color,
        members: { create: dto.members },
      },
      ...this.options,
    });

    const groupPath = path.join(environment.filesPath, dto.id);
    if (!fs.existsSync(groupPath)) {
      fs.mkdirSync(groupPath, { recursive: true });
    }

    return res;
  }

  async findAll(user: TokenPayload) {
    if (user.role !== 'admin') {
      throw Err.Unauthorized('api.groups.resourceAccessDenied');
    }
    return await this.prisma.group.findMany({
      ...this.options,
    });
  }

  async findUserGroups(user: TokenPayload) {
    return await this.prisma.group.findMany({
      where: {
        OR: [{ members: { some: { userId: user.sub } } }, { ownerId: user.sub }],
      },
      ...this.options,
    });
  }

  async findAccessibleGroupIds(user: TokenPayload): Promise<{ id: string }[]> {
    return await this.prisma.group.findMany({
      where:
        user.role === 'admin'
          ? undefined
          : { OR: [{ members: { some: { userId: user.sub } } }, { ownerId: user.sub }] },
      select: { id: true },
    });
  }

  async findOne(id: string, user: TokenPayload): Promise<GroupResponse> {
    await this.assertGroupAccess(id, user);

    return await this.prisma.group.findUnique({
      where: { id },
      ...this.options,
    });
  }

  async addMember(id: string, dto: AddGroupMemberRequest, user: TokenPayload): Promise<GroupResponse> {
    await this.assertGroupOwner(id, user);

    return await this.prisma.group.update({
      where: { id },
      data: {
        members: {
          create: { ...dto },
        },
      },
      ...this.options,
    });
  }

  async addMembers(id: string, dto: AddGroupMembersRequest, user: TokenPayload): Promise<GroupResponse> {
    await this.assertGroupOwner(id, user);

    return await this.prisma.group.update({
      where: { id },
      data: {
        members: {
          createMany: { data: dto.members },
        },
      },
      ...this.options,
    });
  }

  async removeMember(id: string, dto: RemoveGroupMemberRequest, user: TokenPayload): Promise<GroupResponse> {
    await this.assertGroupOwner(id, user);

    return await this.prisma.group.update({
      where: { id },
      data: {
        members: {
          delete: { groupId_userId: { groupId: id, userId: dto.userId } },
        },
      },
      ...this.options,
    });
  }

  async update(id: string, dto: UpdateGroupRequest, user: TokenPayload): Promise<GroupResponse> {
    await this.assertGroupOwner(id, user);

    return await this.prisma.group.update({
      where: { id },
      data: dto,
      ...this.options,
    });
  }

  async updateMember(id: string, dto: UpdateGroupMemberRequest, user: TokenPayload): Promise<GroupResponse> {
    await this.assertGroupOwner(id, user);

    return await this.prisma.group.update({
      where: { id },
      data: {
        members: {
          update: {
            where: { groupId_userId: { groupId: id, userId: dto.userId } },
            data: { access: dto.access },
          },
        },
      },
      ...this.options,
    });
  }

  async remove(id: string, user: TokenPayload): Promise<GroupResponse> {
    await this.assertGroupOwner(id, user);

    return await this.prisma.group.delete({
      where: { id },
      ...this.options,
    });
  }
}
