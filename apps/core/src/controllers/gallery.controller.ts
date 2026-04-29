import { Body, Controller, Delete, Get, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { GalleryService } from '@/services/gallery.service';
import { User } from '@/decorators/user.decorator';
import { type TokenPayload } from '@repo/shared';

@Controller('gallery')
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() _body: Record<string, unknown>,
    @User() user: TokenPayload
  ) {
    const photo = await this.galleryService.create(file, user);
    return photo;
  }

  @Get()
  findAll(@User() user: TokenPayload) {
    return this.galleryService.findAll(user);
  }

  @Get('stats')
  getStats(@User() user: TokenPayload) {
    return this.galleryService.getStats(user);
  }

  @Post('scan')
  scan(@User() user: TokenPayload) {
    return this.galleryService.scan(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @User() user: TokenPayload) {
    return this.galleryService.findOne(id, user);
  }

  @Get(':id/file')
  async findImage(@Param('id') id: string, @User() user: TokenPayload) {
    return await this.galleryService.findImage(id, user);
  }

  @Get(':id/thumbnail')
  async findThumbnail(@Param('id') id: string, @User() user: TokenPayload) {
    return await this.galleryService.findThumbnail(id, user);
  }

  // @Patch(":id")
  // update(@Param("id") id: string, @Body() updatePhotoDto: UpdatePhotoDto) {
  //   return this.galleryService.update(+id, updatePhotoDto);
  // }

  @Delete(':id')
  remove(@Param('id') id: string, @User() user: TokenPayload) {
    return this.galleryService.remove(id, user);
  }
}
