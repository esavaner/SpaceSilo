import { Injectable } from '@nestjs/common';
import { CreateUserRequest, Prisma, type Role, type TokenPayload, UpdateUserRequest } from '@repo/shared';
import { genSalt, hash } from 'bcrypt';
import { GroupsService } from './groups.service';
import { PrismaService } from '@/common/prisma.service';
import { Err } from '@/common/api-message';
import { resolveGroupPath } from '@/common/group-path';

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

  private readonly searchOptions = {
    select: {
      id: true,
      name: true,
      email: true,
    },
  };

  constructor(
    private readonly groupsService: GroupsService,
    private readonly prisma: PrismaService
  ) {}

  private async hashPassword(password: string) {
    return hash(password, await genSalt());
  }

  async create(dto: CreateUserRequest, caller?: Pick<TokenPayload, 'role'>) {
    resolveGroupPath(dto.groupId);
    const existingUser = await this.findByEmail(dto.email);
    if (existingUser) {
      throw Err.Conflict('api.auth.userAlreadyExists');
    }
    if (caller?.role === 'owner' && dto.role === 'owner') {
      throw Err.Forbidden('api.users.ownerRoleForbidden');
    }

    const { groupId, password, role, settings, ...data } = dto;
    const hashedPassword = await this.hashPassword(password);
    const resolvedRole: Role = caller?.role === 'owner' ? (role ?? 'user') : 'user';

    const user = await this.prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
        role: resolvedRole,
        settings: settings === null ? Prisma.DbNull : settings,
      },
      ...this.options,
    });
    await this.groupsService.create({ id: groupId, name: 'Personal', members: [], personal: true }, user.id);
    return user;
  }

  async findAll() {
    return await this.prisma.user.findMany({
      ...this.options,
    });
  }

  async findOne(id: string, caller: TokenPayload) {
    if (caller.sub !== id && caller.role !== 'owner' && caller.role !== 'admin') {
      throw Err.Forbidden('api.users.accessDenied');
    }

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
      ...this.searchOptions,
    });
  }

  async update(id: string, updateUserDto: UpdateUserRequest, caller: TokenPayload) {
    const isSelf = caller.sub === id;

    if (caller.role === 'user') {
      if (!isSelf) {
        throw Err.Forbidden('api.users.accessDenied');
      }
      if (updateUserDto.role !== undefined) {
        throw Err.Forbidden('api.users.roleChangeForbidden');
      }
      if (updateUserDto.email !== undefined || updateUserDto.password !== undefined) {
        throw Err.Forbidden('api.users.selfCredentialsFlowRequired');
      }
    }

    if (updateUserDto.role !== undefined) {
      if (caller.role !== 'owner') {
        throw Err.Forbidden('api.users.roleChangeForbidden');
      }
      if (updateUserDto.role === 'owner') {
        throw Err.Forbidden('api.users.ownerRoleForbidden');
      }
    }

    const target = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true },
    });
    if (!target) {
      throw Err.NotFound('api.users.Err.NotFound');
    }

    if (caller.role === 'admin' && !isSelf && target.role !== 'user') {
      throw Err.Forbidden('api.users.accessDenied');
    }

    if (target.role === 'owner' && updateUserDto.role !== undefined) {
      throw Err.Forbidden('api.users.ownerRoleForbidden');
    }

    if (updateUserDto.email !== undefined && updateUserDto.email !== target.email) {
      const existing = await this.findByEmail(updateUserDto.email);
      if (existing && existing.id !== id) {
        throw Err.Conflict('api.auth.userAlreadyExists');
      }
    }

    const { settings, password, ...data } = updateUserDto;
    return await this.prisma.user.update({
      where: { id },
      data: {
        ...data,
        ...(password !== undefined ? { password: await this.hashPassword(password) } : {}),
        settings: settings === null ? Prisma.DbNull : settings,
      },
      ...this.options,
    });
  }

  async remove(id: string, caller: TokenPayload) {
    const target = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true },
    });
    if (!target) {
      throw Err.NotFound('api.users.Err.NotFound');
    }
    if (target.role === 'owner') {
      throw Err.Forbidden('api.users.ownerDeleteForbidden');
    }
    if (caller.role !== 'owner' && target.role !== 'user') {
      throw Err.Forbidden('api.users.accessDenied');
    }

    return await this.prisma.user.delete({
      where: { id },
      ...this.options,
    });
  }
}
