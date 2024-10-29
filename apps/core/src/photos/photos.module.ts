import { Module } from "@nestjs/common";
import { PhotosService } from "./photos.service";
import { PhotosController } from "./photos.controller";
import { CommonModule } from "src/common/common.module";

@Module({
  imports: [CommonModule],
  controllers: [PhotosController],
  providers: [PhotosService],
})
export class PhotosModule {}
