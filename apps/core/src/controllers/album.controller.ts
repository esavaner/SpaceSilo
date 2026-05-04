import { User } from '@/decorators/user.decorator';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import {
  AddPhotosToAlbumRequest,
  CreateAlbumRequest,
  FindAlbumsRequest,
  type TokenPayload,
  UpdateAlbumRequest,
} from '@repo/shared';
import { AlbumService } from '@/services/album.service';

@Controller('gallery/album')
export class AlbumController {
  constructor(private readonly albumService: AlbumService) {}

  @Post()
  create(@Body() createAlbumDto: CreateAlbumRequest, @User() user: TokenPayload) {
    return this.albumService.create(createAlbumDto, user);
  }

  @Post(':id/photos')
  addPhotos(@Param('id') id: string, @Body() dto: AddPhotosToAlbumRequest, @User() user: TokenPayload) {
    return this.albumService.addPhotos(id, dto, user);
  }

  @Get()
  findAll(@Query() query: FindAlbumsRequest, @User() user: TokenPayload) {
    return this.albumService.findAll(query, user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @User() user: TokenPayload) {
    return this.albumService.findOne(id, user);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAlbumDto: UpdateAlbumRequest, @User() user: TokenPayload) {
    return this.albumService.update(id, updateAlbumDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @User() user: TokenPayload) {
    return this.albumService.remove(id, user);
  }
}
