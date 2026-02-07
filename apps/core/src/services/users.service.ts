import { Injectable } from '@nestjs/common';
import { CreateUserRequest, UpdateUserRequest, UserResponse } from '@repo/shared';
import { GroupsService } from './groups.service';
import { PrismaService } from '@/common/prisma.service';

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

  async create(dto: CreateUserRequest): Promise<UserResponse> {
    const { groupId, ...data } = dto;
    const user = await this.prisma.user.create({
      data,
    });
    await this.groupsService.create({ id: groupId, name: 'Personal', members: [], personal: true }, user.id);
    return user;
  }

  async findAll(): Promise<UserResponse[]> {
    return await this.prisma.user.findMany({});
  }

  async findOne(id: string): Promise<UserResponse> {
    return await this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<UserResponse> {
    return await this.prisma.user.findUnique({
      where: { email },
    });
  }

  async search(query: string): Promise<UserResponse[]> {
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

  async update(id: string, updateUserDto: UpdateUserRequest): Promise<UserResponse> {
    return await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      ...this.options,
    });
  }

  async remove(id: string): Promise<UserResponse> {
    return await this.prisma.user.delete({
      where: { id },
      ...this.options,
    });
  }
}
