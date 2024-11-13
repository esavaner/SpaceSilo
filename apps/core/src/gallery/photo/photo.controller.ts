import {
  Controller,
  Get,
  Post,
  Body,
  // Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  Req,
} from '@nestjs/common';
import { PhotoService } from './photo.service';
// import { UpdatePhotoDto } from "./dto/update-photo.dto";
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { CreatePhotoDto } from '../../_dto/photo.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('photo')
@Controller('gallery/photo')
export class PhotoController {
  constructor(private readonly photoService: PhotoService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() createPhotoDto: CreatePhotoDto,
    @Req() request: Request
  ) {
    const photo = await this.photoService.create(createPhotoDto, file, request['user']);
    return photo;
  }

  @Get()
  findAll() {
    return this.photoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.photoService.findOne(id);
  }

  @Get(':id/thumbnail')
  async findThumbnail(@Param('id') id: string) {
    return await this.photoService.findThumbnail(id);
  }

  // @Patch(":id")
  // update(@Param("id") id: string, @Body() updatePhotoDto: UpdatePhotoDto) {
  //   return this.galleryService.update(+id, updatePhotoDto);
  // }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.photoService.remove(id);
  }
}
