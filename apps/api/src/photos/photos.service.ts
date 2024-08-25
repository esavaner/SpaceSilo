import { Injectable } from "@nestjs/common";
import { CreatePhotoDto } from "./dto/create-photo.dto";
import { UpdatePhotoDto } from "./dto/update-photo.dto";
import { PrismaService } from "src/common/prisma.service";
import * as fs from "fs"; // Import the 'fs' module
import * as path from "path";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const sharp = require("sharp");

const THUMNAIL_HEIGHT = 200;

@Injectable()
export class PhotosService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPhotoDto: CreatePhotoDto, file: Express.Multer.File) {
    console.log(file);
    const photoPath = path.join(process.env.STORAGE_PATH, file.originalname);
    fs.writeFileSync(photoPath, file.buffer);

    const thumbnailPath = path.join(
      process.env.APPDATA_PATH,
      `${file.originalname}`
    );
    const sharpFile = await sharp(file.buffer);
    const metadata = await sharpFile.metadata();
    const aspectRatio = metadata.width / metadata.height;
    await sharpFile
      .resize(Math.floor(aspectRatio * THUMNAIL_HEIGHT), THUMNAIL_HEIGHT)
      .toFile(thumbnailPath);

    // const photo = await this.prisma.photo.create({
    //   data: {
    //     url: `/uploads/${file.originalname}`,
    //     // thumbnailUrl: `/uploads/thumb_${file.originalname}`,
    //     path: photoPath,
    //     metadata: {}, // Add any metadata if needed
    //     // ownerId: createPhotoDto.ownerId,
    //   },
    // });

    // return photo;
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
