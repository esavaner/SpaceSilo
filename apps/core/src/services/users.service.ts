import { Injectable } from '@nestjs/common';
import { CreateUserRequest, Prisma, UpdateUserRequest } from '@repo/shared';
import { GroupsService } from './groups.service';
import { PrismaService } from '@/common/prisma.service';
import { Err } from '@/common/api-message';

@Injectable()
export class UsersService {
  private readonly options = {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      settings: true,
      createdAt: true,
      updatedAt: true,
    },
  };

  constructor(
    private readonly groupsService: GroupsService,
    private readonly prisma: PrismaService
  ) {}

  async create(dto: CreateUserRequest) {
    const { groupId, settings, ...data } = dto;
    const user = await this.prisma.user.create({
      data: { ...data, settings: settings === null ? Prisma.DbNull : settings },
    });
    await this.groupsService.create({ id: groupId, name: 'Personal', members: [], personal: true }, user.id);
    return user;
  }

  async findAll() {
    return await this.prisma.user.findMany({});
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      ...this.options,
    });

    if (!user) {
      throw Err.NotFound('api.users.Err.NotFound');
    }

    return user;
  }

  async findByEmail(email: string) {
    return await this.prisma.user.findUnique({
      where: { email },
    });
  }

  async search(query: string) {
    return await this.prisma.user.findMany({
      where: {
        OR: [
          {
            name: {
              contains: query,
            },
          },
          {
            email: {
              contains: query,
            },
          },
        ],
      },
      ...this.options,
    });
  }

  async update(id: string, updateUserDto: UpdateUserRequest) {
    const { settings, ...data } = updateUserDto;
    return await this.prisma.user.update({
      where: { id },
      data: { ...data, settings: settings === null ? Prisma.DbNull : settings },
      ...this.options,
    });
  }

  async remove(id: string) {
    return await this.prisma.user.delete({
      where: { id },
      ...this.options,
    });
  }
}
