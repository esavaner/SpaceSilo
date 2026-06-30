import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  GroupAccessLevel,
  type CreateNoteRequest,
  type NoteResponse,
  type Prisma,
  type TokenPayload,
  type UpdateNoteRequest,
} from '@repo/shared';
import { PrismaService } from '@/common/prisma.service';

const NOTE_RESPONSE_SELECT = {
  id: true,
  groupId: true,
  ownerId: true,
  title: true,
  content: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} satisfies Prisma.NoteSelect;

type NoteRecord = Prisma.NoteGetPayload<{
  select: typeof NOTE_RESPONSE_SELECT;
}>;

type NoteAccessRecord = NoteRecord & {
  group: {
    ownerId: string;
    members: Array<{
      userId: string;
      access: GroupAccessLevel;
    }>;
  };
};

@Injectable()
export class NotesService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeTitle(title?: string | null) {
    const normalized = title?.trim();
    return normalized ? normalized : null;
  }

  private normalizeContent(content?: string | null) {
    const normalized = content?.trim();
    if (!normalized) {
      throw new BadRequestException('Note content is required');
    }

    return normalized;
  }

  private async getGroupAccess(groupId: string, user: TokenPayload) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      select: {
        id: true,
        ownerId: true,
        members: {
          where: { userId: user.sub },
          select: { userId: true, access: true },
        },
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const membership = group.members[0] ?? null;
    const isOwner = group.ownerId === user.sub;
    const isAdmin = user.role === 'admin';
    const isMember = Boolean(membership);

    return {
      group,
      membership,
      canRead: isOwner || isAdmin || isMember,
      canWrite:
        isOwner ||
        isAdmin ||
        membership?.access === GroupAccessLevel.admin ||
        membership?.access === GroupAccessLevel.edit,
    };
  }

  private async ensureReadableGroup(groupId: string, user: TokenPayload) {
    const access = await this.getGroupAccess(groupId, user);

    if (!access.canRead) {
      throw new UnauthorizedException('You are not allowed to access this group');
    }

    return access;
  }

  private async ensureWritableGroup(groupId: string, user: TokenPayload) {
    const access = await this.getGroupAccess(groupId, user);

    if (!access.canWrite) {
      throw new ForbiddenException('You are not allowed to modify notes in this group');
    }

    return access;
  }

  private async getNoteAccess(noteId: string, user: TokenPayload): Promise<NoteAccessRecord> {
    const note = await this.prisma.note.findUnique({
      where: { id: noteId },
      select: {
        ...NOTE_RESPONSE_SELECT,
        group: {
          select: {
            ownerId: true,
            members: {
              where: { userId: user.sub },
              select: { userId: true, access: true },
            },
          },
        },
      },
    });

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    const isAdmin = user.role === 'admin';
    const isGroupOwner = note.group.ownerId === user.sub;
    const membership = note.group.members[0] ?? null;
    const canRead = isAdmin || isGroupOwner || Boolean(membership);

    if (!canRead) {
      throw new UnauthorizedException('You are not allowed to access this note');
    }

    return note;
  }

  private ensureCanModifyNote(note: NoteAccessRecord, user: TokenPayload) {
    const isAdmin = user.role === 'admin';
    const isGroupOwner = note.group.ownerId === user.sub;
    const isNoteOwner = note.ownerId === user.sub;
    const memberAccess = note.group.members[0]?.access;
    const canWrite =
      isAdmin ||
      isGroupOwner ||
      isNoteOwner ||
      memberAccess === GroupAccessLevel.admin ||
      memberAccess === GroupAccessLevel.edit;

    if (!canWrite) {
      throw new ForbiddenException('You are not allowed to modify this note');
    }
  }

  async create(createNoteDto: CreateNoteRequest, user: TokenPayload): Promise<NoteResponse> {
    await this.ensureWritableGroup(createNoteDto.groupId, user);

    return this.prisma.note.create({
      data: {
        ownerId: user.sub,
        groupId: createNoteDto.groupId,
        title: this.normalizeTitle(createNoteDto.title),
        content: this.normalizeContent(createNoteDto.content),
      },
      select: NOTE_RESPONSE_SELECT,
    });
  }

  async findAll(user: TokenPayload): Promise<NoteResponse[]> {
    const notes = await this.prisma.note.findMany({
      where: {
        OR: [
          { group: { ownerId: user.sub } },
          { group: { members: { some: { userId: user.sub } } } },
          { ownerId: user.sub },
        ],
      },
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
      select: NOTE_RESPONSE_SELECT,
    });

    return notes;
  }

  async findOne(id: string, user: TokenPayload): Promise<NoteResponse> {
    const note = await this.getNoteAccess(id, user);
    return this.toNoteResponse(note);
  }

  async update(id: string, updateNoteDto: UpdateNoteRequest, user: TokenPayload): Promise<NoteResponse> {
    const note = await this.getNoteAccess(id, user);
    this.ensureCanModifyNote(note, user);

    if (!updateNoteDto.groupId && updateNoteDto.title === undefined && updateNoteDto.content === undefined) {
      return this.toNoteResponse(note);
    }

    if (updateNoteDto.groupId && updateNoteDto.groupId !== note.groupId) {
      await this.ensureWritableGroup(updateNoteDto.groupId, user);
    }

    const data: Prisma.NoteUpdateInput = {};

    if (updateNoteDto.groupId) {
      data.group = { connect: { id: updateNoteDto.groupId } };
    }

    if (updateNoteDto.title !== undefined) {
      data.title = this.normalizeTitle(updateNoteDto.title);
    }

    if (updateNoteDto.content !== undefined) {
      data.content = this.normalizeContent(updateNoteDto.content);
    }

    return this.prisma.note.update({
      where: { id },
      data,
      select: NOTE_RESPONSE_SELECT,
    });
  }

  async remove(id: string, user: TokenPayload): Promise<NoteResponse> {
    const note = await this.getNoteAccess(id, user);
    this.ensureCanModifyNote(note, user);

    return this.prisma.note.delete({
      where: { id },
      select: NOTE_RESPONSE_SELECT,
    });
  }

  private toNoteResponse(note: NoteRecord): NoteResponse {
    return {
      id: note.id,
      groupId: note.groupId,
      ownerId: note.ownerId,
      title: note.title,
      content: note.content,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
      deletedAt: note.deletedAt,
    };
  }
}
