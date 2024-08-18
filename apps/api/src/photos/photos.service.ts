import { Injectable } from "@nestjs/common";
import { CreatePhotoDto } from "./dto/create-photo.dto";
import { UpdatePhotoDto } from "./dto/update-photo.dto";
import { PrismaService } from "src/common/prisma.service";

@Injectable()
export class PhotosService {
  constructor(private readonly prisma: PrismaService) {}
  create(createPhotoDto: CreatePhotoDto) {
    return "This action adds a new photo";
  }

  findAll() {
    this.prisma.photo.findMany();
    return `This action returns all photos`;
  }

  findOne(id: number) {
    return `This action returns a #${id} photo`;
  }

  update(id: number, updatePhotoDto: UpdatePhotoDto) {
    return `This action updates a #${id} photo`;
  }

  remove(id: number) {
    return `This action removes a #${id} photo`;
  }
}
