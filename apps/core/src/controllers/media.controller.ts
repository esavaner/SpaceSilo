import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService } from '@/services/media.service';
import { MediaBulkActionRequest, type TokenPayload } from '@repo/shared';
import { User } from '@/decorators/user.decorator';

const GALLERY_CACHE_CONTROL_HEADER = 'private, max-age=31536000, immutable';

type UploadedImageFile = {
  buffer?: Buffer;
  originalname: string;
};

@Controller('gallery/photo')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: UploadedImageFile,
    @Body() _body: Record<string, unknown>,
    @User() user: TokenPayload
  ) {
    const photo = await this.mediaService.create(file, user);
    return photo;
  }

  @Patch('trash')
  trashMany(@Body() dto: MediaBulkActionRequest, @User() user: TokenPayload) {
    return this.mediaService.trashMany(dto.photoIds, user);
  }

  @Patch('restore')
  restoreMany(@Body() dto: MediaBulkActionRequest, @User() user: TokenPayload) {
    return this.mediaService.restoreMany(dto.photoIds, user);
  }

  @Patch('restore-all')
  restoreAll(@User() user: TokenPayload) {
    return this.mediaService.restoreAll(user);
  }

  @Delete('permanent')
  removeManyPermanently(@Body() dto: MediaBulkActionRequest, @User() user: TokenPayload) {
    return this.mediaService.removeManyPermanently(dto.photoIds, user);
  }

  @Delete('trash')
  removeAllTrashed(@User() user: TokenPayload) {
    return this.mediaService.removeAllTrashed(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @User() user: TokenPayload) {
    return this.mediaService.findOne(id, user);
  }

  @Get(':id/file')
  @Header('Cache-Control', GALLERY_CACHE_CONTROL_HEADER)
  @Header('Vary', 'Authorization')
  async findImage(@Param('id') id: string, @User() user: TokenPayload) {
    return await this.mediaService.findImage(id, user);
  }

  @Get(':id/preview')
  @Header('Cache-Control', GALLERY_CACHE_CONTROL_HEADER)
  @Header('Vary', 'Authorization')
  async findPreview(@Param('id') id: string, @User() user: TokenPayload) {
    return await this.mediaService.findPreview(id, user);
  }

  @Get(':id/thumbnail')
  @Header('Cache-Control', GALLERY_CACHE_CONTROL_HEADER)
  @Header('Vary', 'Authorization')
  async findThumbnail(@Param('id') id: string, @User() user: TokenPayload) {
    return await this.mediaService.findThumbnail(id, user);
  }

  // @Patch(":id")
  // update(@Param("id") id: string, @Body() updatePhotoDto: UpdatePhotoDto) {
  //   return this.galleryService.update(+id, updatePhotoDto);
  // }

  @Delete(':id')
  remove(@Param('id') id: string, @User() user: TokenPayload) {
    return this.mediaService.remove(id, user);
  }
}
