import { Body, Controller, Delete, Get, Patch, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import {
  CopyFileRequest,
  CreateFileRequest,
  CreateFolderRequest,
  DownloadFileRequest,
  FileActionResponse,
  FileResponse,
  FindAllFilesRequest,
  FindFileRequest,
  MoveFileRequest,
  RemoveFileRequest,
} from '@repo/shared';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService } from '@/services/files.service';
import { type TokenPayload } from '@repo/shared';
import { User } from '@/decorators/user.decorator';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateFileRequest,
    @User() user: TokenPayload
  ): Promise<FileActionResponse> {
    const result = await this.filesService.createFile(dto, file, user);
    return result;
  }

  @Post('/folder')
  async createFolder(@Body() dto: CreateFolderRequest, @User() user: TokenPayload): Promise<FileActionResponse> {
    const result = await this.filesService.createFolder(dto, user);
    return result;
  }

  @Get('/all')
  findAll(@Query() dto: FindAllFilesRequest, @User() user: TokenPayload): Promise<FileResponse[]> {
    return this.filesService.findAll(dto, user);
  }

  @Get()
  find(@Query() dto: FindFileRequest, @User() user: TokenPayload): Promise<FileResponse> {
    return this.filesService.findFile(dto, user);
  }

  @Get('/download')
  download(@Query() dto: DownloadFileRequest, @User() user: TokenPayload) {
    return this.filesService.download(dto, user);
  }

  @Patch()
  move(@Body() dto: MoveFileRequest, @User() user: TokenPayload): Promise<FileActionResponse> {
    return this.filesService.move(dto, user);
  }

  @Post('/copy')
  copy(@Body() dto: CopyFileRequest, @User() user: TokenPayload): Promise<FileActionResponse> {
    return this.filesService.copy(dto, user);
  }

  @Delete()
  remove(@Body() dto: RemoveFileRequest, @User() user: TokenPayload): Promise<FileActionResponse> {
    return this.filesService.remove(dto, user);
  }
}
