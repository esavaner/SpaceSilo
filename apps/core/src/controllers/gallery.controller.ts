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
} from '@nestjs/common';
import { CreatePhotoDto } from 'src/_dto/photo.dto';
// import { UpdatePhotoDto } from "./dto/update-photo.dto";
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { GalleryService } from 'src/services/gallery.service';
import { User } from 'src/decorators/user.decorator';
import { type TokenPayload } from 'src/common/types';

@ApiTags('gallery')
@Controller('gallery')
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() createPhotoDto: CreatePhotoDto,
    @User() user: TokenPayload
  ) {
    const photo = await this.galleryService.create(createPhotoDto, file, user);
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
