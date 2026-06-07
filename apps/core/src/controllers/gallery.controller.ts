import { BadRequestException, Controller, Get, Post, Query } from '@nestjs/common';
import { GalleryService } from '@/services/gallery.service';
import { User } from '@/decorators/user.decorator';
import { FindGalleryImagesRequest, type TokenPayload } from '@repo/shared';

const parseOptionalBooleanQuery = (value: unknown, fieldName: string) => {
  if (value === undefined) {
    return undefined;
  }

  if (value === true || value === 'true') {
    return true;
  }

  if (value === false || value === 'false') {
    return false;
  }

  throw new BadRequestException(`${fieldName} must be a boolean`);
};

@Controller('gallery')
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  @Get()
  findAll(
    @Query() query: FindGalleryImagesRequest,
    @Query('condensed') condensed: string | undefined,
    @Query('trash') trash: string | undefined,
    @User() user: TokenPayload
  ) {
    return this.galleryService.findAll(
      {
        ...query,
        condensed: parseOptionalBooleanQuery(condensed, 'condensed'),
        trash: parseOptionalBooleanQuery(trash, 'trash'),
      },
      user
    );
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
