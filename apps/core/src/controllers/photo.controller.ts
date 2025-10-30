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
} from '@nestjs/common';
// import { UpdatePhotoDto } from "./dto/update-photo.dto";
import { FileInterceptor } from '@nestjs/platform-express';
import { CreatePhotoDto } from 'src/_dto/photo.dto';
import { ApiTags } from '@nestjs/swagger';
import { PhotoService } from 'src/services/photo.service';
import { type TokenPayload } from 'src/common/types';
import { User } from 'src/decorators/user.decorator';

@ApiTags('photo')
@Controller('gallery/photo')
export class PhotoController {
  constructor(private readonly photoService: PhotoService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() createPhotoDto: CreatePhotoDto,
    @User() user: TokenPayload
  ) {
    const photo = await this.photoService.create(createPhotoDto, file, user);
    return photo;
  }

  @Get()
  findAll() {
    return this.photoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.photoService.findOne(id);
  }

  @Get(':id/thumbnail')
  async findThumbnail(@Param('id') id: string) {
    return await this.photoService.findThumbnail(id);
  }

  // @Patch(":id")
  // update(@Param("id") id: string, @Body() updatePhotoDto: UpdatePhotoDto) {
  //   return this.galleryService.update(+id, updatePhotoDto);
  // }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.photoService.remove(id);
  }
}
