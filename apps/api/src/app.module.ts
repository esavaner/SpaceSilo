import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PhotosModule } from "./photos/photos.module";
import { AlbumsModule } from "./albums/albums.module";
import { CommonModule } from "./common/common.module";

@Module({
  imports: [PhotosModule, AlbumsModule, CommonModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
