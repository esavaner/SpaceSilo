import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';
import {
  AddPhotosToAlbumRequest,
  type AlbumResponse,
  type CreateAlbumRequest,
  type FindAlbumsRequest,
  type GalleryImageResponse,
  type Prisma,
  type TokenPayload,
  type UpdateAlbumRequest,
} from '@repo/shared';

const PHOTO_ORDER_BY: Prisma.PhotoOrderByWithRelationInput[] = [
  { capturedAt: 'desc' },
  { createdAt: 'desc' },
  { id: 'desc' },
];

const ALBUM_RESPONSE_SELECT = {
  id: true,
  name: true,
  capturedAt: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  ownerId: true,
  parentId: true,
  photos: {
    where: { deletedAt: null },
    select: { id: true },
  },
  subalbums: { select: { id: true } },
  group: { select: { id: true } },
  _count: {
    select: {
      photos: { where: { deletedAt: null } },
      subalbums: true,
    },
  },
} satisfies Prisma.AlbumSelect;

const GALLERY_ALBUM_SELECT = {
  id: true,
  name: true,
  parentId: true,
  capturedAt: true,
  createdAt: true,
  photos: {
    where: { deletedAt: null },
    orderBy: PHOTO_ORDER_BY,
    take: 1,
    select: { id: true },
  },
  _count: {
    select: {
      photos: { where: { deletedAt: null } },
      subalbums: true,
    },
  },
} satisfies Prisma.AlbumSelect;

type AlbumResponseRecord = Prisma.AlbumGetPayload<{
  select: typeof ALBUM_RESPONSE_SELECT;
}>;

type GalleryAlbumRecord = Prisma.AlbumGetPayload<{
  select: typeof GALLERY_ALBUM_SELECT;
}>;

const compareAlbumRecords = (
  left: Pick<GalleryAlbumRecord, 'id' | 'capturedAt' | 'createdAt'>,
  right: Pick<GalleryAlbumRecord, 'id' | 'capturedAt' | 'createdAt'>
) => {
  const dateDifference = +(right.capturedAt ?? right.createdAt) - +(left.capturedAt ?? left.createdAt);

  if (dateDifference !== 0) {
    return dateDifference;
  }

  return right.id.localeCompare(left.id);
};

@Injectable()
export class AlbumService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeIds(ids?: string[]) {
    return Array.from(new Set((ids ?? []).filter(Boolean)));
  }

  private mapAlbumResponse(album: AlbumResponseRecord): AlbumResponse {
    return {
      id: album.id,
      name: album.name,
      capturedAt: album.capturedAt,
      createdAt: album.createdAt,
      updatedAt: album.updatedAt,
      deletedAt: album.deletedAt,
      ownerId: album.ownerId,
      parentId: album.parentId,
      subalbumIds: album.subalbums.map((subalbum) => subalbum.id),
      photoIds: album.photos.map((photo) => photo.id),
      groupIds: album.group.map((group) => group.id),
      photoCount: album._count.photos,
      subalbumCount: album._count.subalbums,
    };
  }

  toGalleryItemResponse(album: GalleryAlbumRecord): GalleryImageResponse {
    const coverPhotoId = album.photos[0]?.id;

    return {
      id: album.id,
      type: 'album',
      name: album.name,
      thumbnailPath: coverPhotoId ? `/gallery/photo/${coverPhotoId}/thumbnail` : undefined,
      capturedAt: album.capturedAt,
      createdAt: album.createdAt,
      parentAlbumId: album.parentId,
      photoCount: album._count.photos,
      subalbumCount: album._count.subalbums,
    };
  }

  private async findOwnedAlbumOrThrow(id: string, ownerId: string) {
    const album = await this.prisma.album.findFirst({
      where: { id, ownerId },
      select: { id: true, parentId: true, capturedAt: true },
    });

    if (!album) {
      throw new NotFoundException('Album not found');
    }

    return album;
  }

  private async ensureParentExists(parentId: string, ownerId: string) {
    const parent = await this.prisma.album.findFirst({
      where: { id: parentId, ownerId },
      select: { id: true },
    });

    if (!parent) {
      throw new NotFoundException('Parent album not found');
    }
  }

  private async ensureNoCycle(albumId: string, parentId: string | null | undefined, ownerId: string) {
    if (!parentId) {
      return;
    }

    if (parentId === albumId) {
      throw new BadRequestException('Album cannot be its own parent');
    }

    let currentParentId: string | null | undefined = parentId;

    while (currentParentId) {
      if (currentParentId === albumId) {
        throw new BadRequestException('Album nesting would create a cycle');
      }

      const album = await this.prisma.album.findFirst({
        where: { id: currentParentId, ownerId },
        select: { parentId: true },
      });

      if (!album) {
        throw new NotFoundException('Parent album not found');
      }

      currentParentId = album.parentId;
    }
  }

  private async ensureOwnedPhotos(photoIds: string[], ownerId: string) {
    if (!photoIds.length) {
      return;
    }

    const count = await this.prisma.photo.count({
      where: {
        id: { in: photoIds },
        ownerId,
        deletedAt: null,
      },
    });

    if (count !== photoIds.length) {
      throw new BadRequestException('One or more photos do not exist');
    }
  }

  private async ensureOwnedGroups(groupIds: string[], ownerId: string) {
    if (!groupIds.length) {
      return;
    }

    const count = await this.prisma.group.count({
      where: {
        id: { in: groupIds },
        ownerId,
      },
    });

    if (count !== groupIds.length) {
      throw new BadRequestException('One or more groups do not exist');
    }
  }

  private pickNewestDate(...dates: Array<Date | null | undefined>) {
    return dates.reduce<Date | null>((latest, current) => {
      if (!current) {
        return latest;
      }

      if (!latest || current.getTime() > latest.getTime()) {
        return current;
      }

      return latest;
    }, null);
  }

  async refreshAlbumCapturedAtCascade(startAlbumId?: string | null) {
    let currentAlbumId = startAlbumId;

    while (currentAlbumId) {
      const currentAlbum = await this.prisma.album.findUnique({
        where: { id: currentAlbumId },
        select: { id: true, parentId: true, capturedAt: true },
      });

      if (!currentAlbum) {
        break;
      }

      const [latestPhoto, latestSubalbum] = await Promise.all([
        this.prisma.photo.findFirst({
          where: {
            deletedAt: null,
            albums: {
              some: { id: currentAlbum.id },
            },
          },
          orderBy: PHOTO_ORDER_BY,
          select: { capturedAt: true },
        }),
        this.prisma.album.aggregate({
          where: { parentId: currentAlbum.id },
          _max: { capturedAt: true },
        }),
      ]);

      const nextCapturedAt = this.pickNewestDate(latestPhoto?.capturedAt, latestSubalbum._max.capturedAt);
      const currentTime = currentAlbum.capturedAt?.getTime() ?? null;
      const nextTime = nextCapturedAt?.getTime() ?? null;

      if (currentTime !== nextTime) {
        await this.prisma.album.update({
          where: { id: currentAlbum.id },
          data: { capturedAt: nextCapturedAt },
        });
      }

      currentAlbumId = currentAlbum.parentId;
    }
  }

  async refreshCapturedAtForPhotos(photoIds: string[]) {
    const normalizedIds = this.normalizeIds(photoIds);
    if (!normalizedIds.length) {
      return;
    }

    const albums = await this.prisma.album.findMany({
      where: {
        photos: {
          some: {
            id: { in: normalizedIds },
          },
        },
      },
      select: { id: true },
    });

    for (const album of albums) {
      await this.refreshAlbumCapturedAtCascade(album.id);
    }
  }

  async findDescendantIds(albumId: string, ownerId: string) {
    await this.findOwnedAlbumOrThrow(albumId, ownerId);

    const descendants: string[] = [];
    let parentIds = [albumId];

    while (parentIds.length > 0) {
      const children = await this.prisma.album.findMany({
        where: {
          ownerId,
          parentId: { in: parentIds },
        },
        select: { id: true },
      });

      if (!children.length) {
        break;
      }

      parentIds = children.map((child) => child.id);
      descendants.push(...parentIds);
    }

    return descendants;
  }

  async findGalleryAlbums({ ownerId, parentId, take }: { ownerId: string; parentId?: string | null; take: number }) {
    const albums = await this.prisma.album.findMany({
      where: {
        ownerId,
        deletedAt: null,
        parentId: parentId ?? null,
      },
      select: GALLERY_ALBUM_SELECT,
    });

    return albums.sort(compareAlbumRecords).slice(0, take);
  }

  async create(createAlbumDto: CreateAlbumRequest, user: TokenPayload) {
    const photoIds = this.normalizeIds(createAlbumDto.photoIds);
    const groupIds = this.normalizeIds(createAlbumDto.groupIds);
    const parentId = createAlbumDto.parentId ?? null;

    if (parentId) {
      await this.ensureParentExists(parentId, user.sub);
    }

    await Promise.all([this.ensureOwnedPhotos(photoIds, user.sub), this.ensureOwnedGroups(groupIds, user.sub)]);

    const createdAlbum = await this.prisma.album.create({
      data: {
        name: createAlbumDto.name,
        ownerId: user.sub,
        parentId,
        photos: photoIds.length ? { connect: photoIds.map((id) => ({ id })) } : undefined,
        group: groupIds.length ? { connect: groupIds.map((id) => ({ id })) } : undefined,
      },
      select: { id: true },
    });

    await this.refreshAlbumCapturedAtCascade(createdAlbum.id);
    return this.findOne(createdAlbum.id, user);
  }

  async addPhotos(id: string, dto: AddPhotosToAlbumRequest, user: TokenPayload) {
    const album = await this.findOwnedAlbumOrThrow(id, user.sub);
    const photoIds = this.normalizeIds(dto.photoIds);
    await this.ensureOwnedPhotos(photoIds, user.sub);

    if (photoIds.length) {
      await this.prisma.album.update({
        where: { id: album.id },
        data: {
          photos: {
            connect: photoIds.map((photoId) => ({ id: photoId })),
          },
        },
      });

      await this.refreshAlbumCapturedAtCascade(album.id);
    }

    return this.findOne(album.id, user);
  }

  async findAll(query: FindAlbumsRequest, user: TokenPayload) {
    if (query.parentId) {
      await this.ensureParentExists(query.parentId, user.sub);
    }

    const albums = await this.prisma.album.findMany({
      where: {
        ownerId: user.sub,
        deletedAt: null,
        ...(query.parentId !== undefined ? { parentId: query.parentId ?? null } : {}),
      },
      orderBy: [{ capturedAt: 'desc' }, { createdAt: 'desc' }, { name: 'asc' }],
      select: ALBUM_RESPONSE_SELECT,
    });

    return albums.map((album) => this.mapAlbumResponse(album));
  }

  async findOne(id: string, user: TokenPayload) {
    const album = await this.prisma.album.findFirst({
      where: { id, ownerId: user.sub, deletedAt: null },
      select: ALBUM_RESPONSE_SELECT,
    });

    if (!album) {
      throw new NotFoundException('Album not found');
    }

    return this.mapAlbumResponse(album);
  }

  async update(id: string, updateAlbumDto: UpdateAlbumRequest, user: TokenPayload) {
    const existingAlbum = await this.findOwnedAlbumOrThrow(id, user.sub);
    const photoIds = updateAlbumDto.photoIds !== undefined ? this.normalizeIds(updateAlbumDto.photoIds) : undefined;
    const groupIds = updateAlbumDto.groupIds !== undefined ? this.normalizeIds(updateAlbumDto.groupIds) : undefined;
    const nextParentId =
      updateAlbumDto.parentId === undefined ? existingAlbum.parentId : (updateAlbumDto.parentId ?? null);

    if (updateAlbumDto.parentId !== undefined) {
      if (nextParentId) {
        await this.ensureParentExists(nextParentId, user.sub);
      }

      await this.ensureNoCycle(existingAlbum.id, nextParentId, user.sub);
    }

    await Promise.all([
      photoIds ? this.ensureOwnedPhotos(photoIds, user.sub) : Promise.resolve(),
      groupIds ? this.ensureOwnedGroups(groupIds, user.sub) : Promise.resolve(),
    ]);

    await this.prisma.album.update({
      where: { id: existingAlbum.id },
      data: {
        ...(updateAlbumDto.name !== undefined ? { name: updateAlbumDto.name } : {}),
        ...(updateAlbumDto.parentId !== undefined ? { parentId: nextParentId } : {}),
        ...(photoIds !== undefined
          ? {
              photos: {
                set: photoIds.map((photoId) => ({ id: photoId })),
              },
            }
          : {}),
        ...(groupIds !== undefined
          ? {
              group: {
                set: groupIds.map((groupId) => ({ id: groupId })),
              },
            }
          : {}),
      },
    });

    await this.refreshAlbumCapturedAtCascade(existingAlbum.id);

    if (updateAlbumDto.parentId !== undefined && existingAlbum.parentId && existingAlbum.parentId !== nextParentId) {
      await this.refreshAlbumCapturedAtCascade(existingAlbum.parentId);
    }

    return this.findOne(existingAlbum.id, user);
  }

  async remove(id: string, user: TokenPayload) {
    const album = await this.findOne(id, user);

    await this.prisma.album.delete({
      where: { id },
    });

    if (album.parentId) {
      await this.refreshAlbumCapturedAtCascade(album.parentId);
    }

    return album;
  }
}
