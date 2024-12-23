import { Controller, Get, Post, Body, Delete, UseInterceptors, UploadedFile, Req, Query, Patch } from '@nestjs/common';
import { FilesService } from './files.service';
import {
  CreateFileDto,
  FindAllFilesDto,
  DownloadFileDto,
  RemoveFileDto,
  MoveFileDto,
  CreateFolderDto,
  CopyFileDto,
} from '../_dto/files.dto';
import { ApiConsumes, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Auth, AuthType } from 'src/auth/decorators/auth.decorator';
import { FileEntity } from 'src/_entity/files.entity';

@ApiTags('files')
@Controller('files')
@Auth(AuthType.None) // @TODO remove this
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiOkResponse({ description: 'File created successfully' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Body() dto: CreateFileDto, @Req() request: Request) {
    const result = await this.filesService.createFile(dto, file, request['user']);
    return result;
  }

  @Post('/folder')
  @ApiOkResponse({ description: 'Folder created successfully' })
  async createFolder(@Body() dto: CreateFolderDto, @Req() request: Request) {
    const result = await this.filesService.createFolder(dto, request['user']);
    return result;
  }

  @Get()
  @ApiOkResponse({ type: FileEntity, isArray: true })
  findAll(@Query() dto: FindAllFilesDto) {
    return this.filesService.findAll(dto);
  }

  @Get('/download')
  download(@Query() dto: DownloadFileDto) {
    return this.filesService.download(dto);
  }

  @Patch()
  move(@Query() dto: MoveFileDto) {
    return this.filesService.move(dto);
  }

  @Post('/copy')
  copy(@Query() dto: CopyFileDto) {
    return this.filesService.copy(dto);
  }

  @Delete()
  remove(@Query() dto: RemoveFileDto) {
    return this.filesService.remove(dto);
  }
}
