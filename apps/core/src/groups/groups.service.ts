import { ForbiddenException, Injectable } from '@nestjs/common';
import { AddMemberDto, AddMembersDto, CreateGroupDto, RemoveMemberDto, UpdateMemberDto } from 'src/_dto/group.dto';
import { TokenPayload } from 'src/auth/auth.types';
import { PrismaService } from 'src/common/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaModel } from 'src/_gen/prisma-class';

// with members
type WithMembers = PrismaModel.Group & { members: PrismaModel.GroupMember[] };

@Injectable()
export class GroupsService {
  private readonly options = { include: { members: true } };

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateGroupDto, user: TokenPayload): Promise<WithMembers> {
    const existingGroup = await this.prisma.group.findUnique({ where: { groupId: dto.groupId } });

    if (existingGroup) {
      throw new ForbiddenException('Group with this ID already exists');
    }

    const res = await this.prisma.group.create({
      data: { ownerId: user.sub, name: dto.name, groupId: dto.groupId, members: { create: dto.members } },
      ...this.options,
    });

    const groupPath = path.join(process.env.FILES_PATH, dto.groupId);
    if (!fs.existsSync(groupPath)) {
      fs.mkdirSync(groupPath, { recursive: true });
    }

    return res;
  }

  async findAll(): Promise<WithMembers[]> {
    return await this.prisma.group.findMany({ ...this.options });
  }

  async findOne(groupId: string): Promise<WithMembers> {
    return await this.prisma.group.findUnique({
      where: { groupId },
      ...this.options,
    });
  }

  async addMember(groupId: string, dto: AddMemberDto): Promise<WithMembers> {
    return await this.prisma.group.update({
      where: { id: groupId },
      data: {
        members: {
          create: { ...dto },
        },
      },
      ...this.options,
    });
  }

  async addMembers(groupId: string, dto: AddMembersDto): Promise<WithMembers> {
    return await this.prisma.group.update({
      where: { id: groupId },
      data: {
        members: {
          createMany: { data: dto.members },
        },
      },
      ...this.options,
    });
  }

  async removeMember(groupId: string, dto: RemoveMemberDto): Promise<WithMembers> {
    return await this.prisma.group.update({
      where: { id: groupId },
      data: {
        members: {
          delete: { groupId_userId: { groupId, userId: dto.userId } },
        },
      },
      ...this.options,
    });
  }

  async updateMember(groupId: string, dto: UpdateMemberDto): Promise<WithMembers> {
    return await this.prisma.group.update({
      where: { id: groupId },
      data: {
        members: {
          update: { where: { groupId_userId: { groupId, userId: dto.userId } }, data: { ...dto } },
        },
      },
      ...this.options,
    });
  }

  async remove(id: string): Promise<WithMembers> {
    return await this.prisma.group.delete({
      where: { id },
      ...this.options,
    });
  }
}
