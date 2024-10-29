import {
  Controller,
  Get,
  Post,
  Body,
  // Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  Req,
} from "@nestjs/common";
import { PhotosService } from "./photos.service";
import { CreatePhotoDto } from "./dto/create-photo.dto";
// import { UpdatePhotoDto } from "./dto/update-photo.dto";
import { FileInterceptor } from "@nestjs/platform-express";
import { Request } from "express";

@Controller("photos")
export class PhotosController {
  constructor(private readonly photosService: PhotosService) {}

  @Post()
  @UseInterceptors(FileInterceptor("file"))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() createPhotoDto: CreatePhotoDto,
    @Req() request: Request
  ) {
    const photo = await this.photosService.create(
      createPhotoDto,
      file,
      request["user"]
    );
    return photo;
  }

  @Get()
  findAll() {
    return this.photosService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.photosService.findOne(id);
  }

  @Get(":id/thumbnail")
  async findThumbnail(@Param("id") id: string) {
    return await this.photosService.findThumbnail(id);
  }

  // @Patch(":id")
  // update(@Param("id") id: string, @Body() updatePhotoDto: UpdatePhotoDto) {
  //   return this.photosService.update(+id, updatePhotoDto);
  // }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.photosService.remove(id);
  }
}
