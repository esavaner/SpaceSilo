import { Injectable } from '@nestjs/common';
import {
  GroupAccessLevel,
  type CreateNoteRequest,
  type NoteResponse,
  type Prisma,
  type TokenPayload,
  type UpdateNoteRequest,
} from '@repo/shared';
import { PrismaService } from '@/common/prisma.service';
import { Err } from '@/common/api-message';

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
      throw Err.BadRequest('api.notes.contentRequired');
    }

    return normalized;
  }

  private canWrite(user: TokenPayload, group: { ownerId: string; members: Array<{ access: GroupAccessLevel }> }) {
    const access = group.members[0]?.access;
    return (
      user.role === 'admin' ||
      group.ownerId === user.sub ||
      access === GroupAccessLevel.admin ||
      access === GroupAccessLevel.edit
    );
  }

  private async ensureWritableGroup(groupId: string, user: TokenPayload) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      select: {
        ownerId: true,
        members: {
          where: { userId: user.sub },
          select: { access: true },
        },
      },
    });

    if (!group) {
      throw Err.NotFound('api.notes.groupErr.NotFound');
    }

    if (!this.canWrite(user, group)) {
      throw Err.Forbidden('api.notes.groupWriteDenied');
    }
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
      throw Err.NotFound('api.notes.Err.NotFound');
    }

    const canRead = user.role === 'admin' || note.group.ownerId === user.sub || note.group.members.length > 0;
    if (!canRead) {
      throw Err.Unauthorized('api.notes.noteAccessDenied');
    }

    return note;
  }

  private ensureCanModifyNote(note: NoteAccessRecord, user: TokenPayload) {
    if (note.ownerId !== user.sub && !this.canWrite(user, note.group)) {
      throw Err.Forbidden('api.notes.noteWriteDenied');
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
    return this.prisma.note.findMany({
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

  private toNoteResponse({ group: _group, ...note }: NoteAccessRecord): NoteResponse {
    return note;
  }
}
