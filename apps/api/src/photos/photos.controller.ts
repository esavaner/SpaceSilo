import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
} from "@nestjs/common";
import { PhotosService } from "./photos.service";
import { CreatePhotoDto } from "./dto/create-photo.dto";
import { UpdatePhotoDto } from "./dto/update-photo.dto";
import { FileInterceptor } from "@nestjs/platform-express";

@Controller("photos")
export class PhotosController {
  constructor(private readonly photosService: PhotosService) {}

  @Post()
  @UseInterceptors(FileInterceptor("file"))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() createPhotoDto: CreatePhotoDto
  ) {
    const photo = await this.photosService.create(createPhotoDto, file);
    return photo;
  }

  @Get()
  findAll() {
    return this.photosService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.photosService.findOne(+id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() updatePhotoDto: UpdatePhotoDto) {
    return this.photosService.update(+id, updatePhotoDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.photosService.remove(+id);
  }
}
