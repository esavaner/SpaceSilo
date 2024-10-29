import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PhotosModule } from "./photos/photos.module";
import { AlbumsModule } from "./albums/albums.module";
import { CommonModule } from "./common/common.module";
import { UsersModule } from "./users/users.module";
import { AuthModule } from "./auth/auth.module";

@Module({
  imports: [PhotosModule, AlbumsModule, CommonModule, UsersModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
