import { Module } from '@nestjs/common';
import { GalleryService } from './gallery.service';
import { GalleryController } from './gallery.controller';
import { CommonModule } from 'src/common/common.module';
import { PhotoController } from './photo/photo.controller';
import { AlbumController } from './album/album.controller';
import { PhotoService } from './photo/photo.service';
import { AlbumService } from './album/album.service';

@Module({
  imports: [CommonModule],
  controllers: [GalleryController, PhotoController, AlbumController],
  providers: [GalleryService, PhotoService, AlbumService],
})
export class GalleryModule {}
