import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CreateNoteRequest, NoteResponse, UpdateNoteRequest } from '@repo/shared';
import { NotesService } from '@/services/notes.service';
import { User } from '@/decorators/user.decorator';
import { type TokenPayload } from '@repo/shared';

@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  create(@Body() createNoteDto: CreateNoteRequest, @User() user: TokenPayload): Promise<NoteResponse> {
    return this.notesService.create(createNoteDto, user);
  }

  @Get()
  findAll(@User() user: TokenPayload): Promise<NoteResponse[]> {
    return this.notesService.findAll(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @User() user: TokenPayload): Promise<NoteResponse> {
    return this.notesService.findOne(id, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateNoteDto: UpdateNoteRequest,
    @User() user: TokenPayload
  ): Promise<NoteResponse> {
    return this.notesService.update(id, updateNoteDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @User() user: TokenPayload): Promise<NoteResponse> {
    return this.notesService.remove(id, user);
  }
}
