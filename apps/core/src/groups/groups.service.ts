import { Injectable } from '@nestjs/common';
import { AddMemberDto, CreateGroupDto, RemoveMemberDto, UpdateMemberDto } from 'src/_dto/group.dto';
import { TokenPayload } from 'src/auth/auth.types';
import { PrismaService } from 'src/common/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class GroupsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateGroupDto, user: TokenPayload) {
    const groupPath = path.join(process.env.FILES_PATH, dto.groupId);
    if (!fs.existsSync(groupPath)) {
      fs.mkdirSync(groupPath, { recursive: true });
    } else {
      throw new Error('Group with this ID already exists');
    }
    const res = await this.prisma.group.create({
      data: { ...dto, ownerId: user.sub, members: { create: dto.members } },
    });
    return res;
  }

  async findAll() {
    return await this.prisma.group.findMany();
  }

  async findOne(groupId: string) {
    return await this.prisma.group.findUnique({
      where: { groupId },
    });
  }

  async addMember(groupId: string, dto: AddMemberDto) {
    return await this.prisma.group.update({
      where: { id: groupId },
      data: {
        members: {
          create: { ...dto },
        },
      },
    });
  }

  async removeMember(groupId: string, dto: RemoveMemberDto) {
    return await this.prisma.group.update({
      where: { id: groupId },
      data: {
        members: {
          delete: { groupId_userId: { groupId, userId: dto.userId } },
        },
      },
    });
  }

  async updateMember(groupId: string, dto: UpdateMemberDto) {
    return await this.prisma.group.update({
      where: { id: groupId },
      data: {
        members: {
          update: { where: { groupId_userId: { groupId, userId: dto.userId } }, data: { ...dto } },
        },
      },
    });
  }

  async remove(id: string) {
    return await this.prisma.group.delete({
      where: { id },
    });
  }
}
