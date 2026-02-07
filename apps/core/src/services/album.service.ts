import { Injectable } from '@nestjs/common';
import { CreateAlbumRequest, UpdateAlbumRequest } from '@repo/shared';

@Injectable()
export class AlbumService {
  create(createAlbumDto: CreateAlbumRequest) {
    return 'This action adds a new album';
  }

  findAll() {
    return `This action returns all albums`;
  }

  findOne(id: number) {
    return `This action returns a #${id} album`;
  }

  update(id: number, updateAlbumDto: UpdateAlbumRequest) {
    return `This action updates a #${id} album`;
  }

  remove(id: number) {
    return `This action removes a #${id} album`;
  }
}
