import { Injectable } from '@nestjs/common';
import { CreateUserDto, GetUserDto, SearchUserDto, UpdateUserDto } from 'src/_dto/user.dto';
import { PrismaService } from 'src/common/prisma.service';

@Injectable()
export class UsersService {
  private readonly options = {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  };

  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<GetUserDto> {
    return await this.prisma.user.create({
      data: createUserDto,
    });
  }

  async findAll(): Promise<GetUserDto[]> {
    return await this.prisma.user.findMany({});
  }

  async findOne(id: string): Promise<GetUserDto> {
    return await this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<GetUserDto> {
    return await this.prisma.user.findUnique({
      where: { email },
    });
  }

  async search(query: string): Promise<SearchUserDto[]> {
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

  async update(id: string, updateUserDto: UpdateUserDto): Promise<SearchUserDto> {
    return await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      ...this.options,
    });
  }

  async remove(id: string): Promise<SearchUserDto> {
    return await this.prisma.user.delete({
      where: { id },
      ...this.options,
    });
  }
}
