import { Injectable } from '@nestjs/common';
import { CreateUserDto, GetUserDto, SearchUserDto, UpdateUserDto } from 'src/_dto/user.dto';
import { GroupsService } from './groups.service';
import { prisma } from 'src/prisma/prisma';

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

  constructor(private readonly groupsService: GroupsService) {}

  // async create(dto: CreateUserDto): Promise<GetUserDto> {
  async create(dto: any): Promise<GetUserDto> {
    const { groupId, ...data } = dto;
    const user = await prisma.user.create({
      data,
    });
    await this.groupsService.create({ id: groupId, name: 'Personal', members: [], personal: true }, user.id);
    return user;
  }

  async findAll(): Promise<GetUserDto[]> {
    return await prisma.user.findMany({});
  }

  async findOne(id: string): Promise<GetUserDto> {
    return await prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<GetUserDto> {
    return await prisma.user.findUnique({
      where: { email },
    });
  }

  async search(query: string): Promise<SearchUserDto[]> {
    return await prisma.user.findMany({
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

  async update(id: string, updateUserDto: UpdateUserDto): Promise<SearchUserDto> {
    return await prisma.user.update({
      where: { id },
      data: updateUserDto,
      ...this.options,
    });
  }

  async remove(id: string): Promise<SearchUserDto> {
    return await prisma.user.delete({
      where: { id },
      ...this.options,
    });
  }
}
