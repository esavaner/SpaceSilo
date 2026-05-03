import { Controller, Get, Post, Query } from '@nestjs/common';
import { GalleryService } from '@/services/gallery.service';
import { User } from '@/decorators/user.decorator';
import { FindGalleryImagesRequest, type TokenPayload } from '@repo/shared';

@Controller('gallery')
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  @Get()
  findAll(@Query() query: FindGalleryImagesRequest, @User() user: TokenPayload) {
    return this.galleryService.findAll(query, user);
  }

  @Get('stats')
  getStats(@User() user: TokenPayload) {
    return this.galleryService.getStats(user);
  }

  @Post('scan')
  scan(@User() user: TokenPayload) {
    return this.galleryService.scan(user);
  }
}
