import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import {
  AddMemberDto,
  AddMembersDto,
  CreateGroupDto,
  GetGroupDto,
  RemoveMemberDto,
  UpdateMemberDto,
} from 'src/_dto/group.dto';
import { PrismaService } from '@/common/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import { TokenPayload } from 'src/common/types';

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

  // async create(dto: CreateGroupDto, userId: string): Promise<GetGroupDto> {
  async create(dto: any, userId: string): Promise<GetGroupDto> {
    const existingGroup = await this.prisma.group.findUnique({ where: { id: dto.id } });

    if (existingGroup) {
      throw new ForbiddenException('Group with this ID already exists');
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

    const groupPath = path.join(process.env.FILES_PATH, dto.id);
    if (!fs.existsSync(groupPath)) {
      fs.mkdirSync(groupPath, { recursive: true });
    }

    return res;
  }

  async findAll(user: TokenPayload) {
    if (user.role !== 'admin') {
      throw new UnauthorizedException('You are not allowed to access this resource');
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

  async findOne(id: string): Promise<GetGroupDto> {
    return await this.prisma.group.findUnique({
      where: { id },
      ...this.options,
    });
  }

  // async addMember(id: string, dto: AddMemberDto): Promise<GetGroupDto> {
  async addMember(id: string, dto: any) {
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

  // async addMembers(id: string, dto: AddMembersDto): Promise<GetGroupDto> {
  async addMembers(id: string, dto: any) {
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

  // async removeMember(id: string, dto: RemoveMemberDto): Promise<GetGroupDto> {
  async removeMember(id: string, dto: any) {
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

  // async updateMember(id: string, dto: UpdateMemberDto): Promise<GetGroupDto> {
  async updateMember(id: string, dto: any) {
    return await this.prisma.group.update({
      where: { id },
      data: {
        members: {
          update: { where: { groupId_userId: { groupId: id, userId: dto.userId } }, data: { ...dto } },
        },
      },
      ...this.options,
    });
  }

  async remove(id: string): Promise<GetGroupDto> {
    return await this.prisma.group.delete({
      where: { id },
      ...this.options,
    });
  }
}
