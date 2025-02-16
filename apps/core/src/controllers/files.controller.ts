import { Controller, Get, Post, Body, Delete, UseInterceptors, UploadedFile, Query, Patch } from '@nestjs/common';
import {
  CreateFileDto,
  FindAllFilesDto,
  DownloadFileDto,
  RemoveFileDto,
  MoveFileDto,
  CreateFolderDto,
  CopyFileDto,
  FileEntity,
  FindFileDto,
} from 'src/_dto/files.dto';
import { ApiConsumes, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService } from 'src/services/files.service';
import { TokenPayload } from 'src/common/types';
import { User } from 'src/decorators/user.decorator';

@ApiTags('files')
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiOkResponse({ description: 'File created successfully' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Body() dto: CreateFileDto, @User() user: TokenPayload) {
    const result = await this.filesService.createFile(dto, file, user);
    return result;
  }

  @Post('/folder')
  @ApiOkResponse({ description: 'Folder created successfully' })
  async createFolder(@Body() dto: CreateFolderDto, @User() user: TokenPayload) {
    const result = await this.filesService.createFolder(dto, user);
    return result;
  }

  @Get('/all')
  @ApiOkResponse({ type: FileEntity, isArray: true })
  findAll(@Query() dto: FindAllFilesDto, @User() user: TokenPayload) {
    return this.filesService.findAll(dto, user);
  }

  @Get()
  @ApiOkResponse({ type: FileEntity })
  find(@Query() dto: FindFileDto, @User() user: TokenPayload) {
    return this.filesService.findFile(dto, user);
  }

  @Get('/download')
  download(@Query() dto: DownloadFileDto, @User() user: TokenPayload) {
    return this.filesService.download(dto, user);
  }

  @Patch()
  move(@Query() dto: MoveFileDto, @User() user: TokenPayload) {
    return this.filesService.move(dto, user);
  }

  @Post('/copy')
  copy(@Query() dto: CopyFileDto, @User() user: TokenPayload) {
    return this.filesService.copy(dto, user);
  }

  @Delete()
  remove(@Query() dto: RemoveFileDto, @User() user: TokenPayload) {
    return this.filesService.remove(dto, user);
  }
}
