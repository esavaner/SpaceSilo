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
import { GalleryService } from './gallery.service';
import { CreatePhotoDto } from './_dto/photo.dto';
// import { UpdatePhotoDto } from "./dto/update-photo.dto";
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('gallery')
@Controller('gallery')
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() createPhotoDto: CreatePhotoDto,
    @Req() request: Request
  ) {
    const photo = await this.galleryService.create(createPhotoDto, file, request['user']);
    return photo;
  }

  @Get()
  findAll() {
    return this.galleryService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.galleryService.findOne(id);
  }

  @Get(':id/thumbnail')
  async findThumbnail(@Param('id') id: string) {
    return await this.galleryService.findThumbnail(id);
  }

  // @Patch(":id")
  // update(@Param("id") id: string, @Body() updatePhotoDto: UpdatePhotoDto) {
  //   return this.galleryService.update(+id, updatePhotoDto);
  // }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.galleryService.remove(id);
  }
}
