import { Body, Controller, Delete, Get, Header, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PhotoService } from '@/services/photo.service';
import { type TokenPayload } from '@repo/shared';
import { User } from '@/decorators/user.decorator';

const GALLERY_CACHE_CONTROL_HEADER = 'private, max-age=31536000, immutable';

type UploadedImageFile = {
  buffer?: Buffer;
  originalname: string;
};

@Controller('gallery/photo')
export class PhotoController {
  constructor(private readonly photoService: PhotoService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: UploadedImageFile,
    @Body() _body: Record<string, unknown>,
    @User() user: TokenPayload
  ) {
    const photo = await this.photoService.create(file, user);
    return photo;
  }

  @Get(':id')
  findOne(@Param('id') id: string, @User() user: TokenPayload) {
    return this.photoService.findOne(id, user);
  }

  @Get(':id/file')
  @Header('Cache-Control', GALLERY_CACHE_CONTROL_HEADER)
  @Header('Vary', 'Authorization')
  async findImage(@Param('id') id: string, @User() user: TokenPayload) {
    return await this.photoService.findImage(id, user);
  }

  @Get(':id/preview')
  @Header('Cache-Control', GALLERY_CACHE_CONTROL_HEADER)
  @Header('Vary', 'Authorization')
  async findPreview(@Param('id') id: string, @User() user: TokenPayload) {
    return await this.photoService.findPreview(id, user);
  }

  @Get(':id/thumbnail')
  @Header('Cache-Control', GALLERY_CACHE_CONTROL_HEADER)
  @Header('Vary', 'Authorization')
  async findThumbnail(@Param('id') id: string, @User() user: TokenPayload) {
    return await this.photoService.findThumbnail(id, user);
  }

  // @Patch(":id")
  // update(@Param("id") id: string, @Body() updatePhotoDto: UpdatePhotoDto) {
  //   return this.galleryService.update(+id, updatePhotoDto);
  // }

  @Delete(':id')
  remove(@Param('id') id: string, @User() user: TokenPayload) {
    return this.photoService.remove(id, user);
  }
}
