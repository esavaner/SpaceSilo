import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';
import { API_PREFIX_PATH } from '@repo/shared/constants/api';
import {
  AddPhotosToAlbumRequest,
  type AlbumResponse,
  type AlbumSearchResponse,
  type CreateAlbumRequest,
  type FindAlbumsRequest,
  type GalleryImageResponse,
  type Prisma,
  type SearchAlbumsRequest,
  type TokenPayload,
  type UpdateAlbumRequest,
} from '@repo/shared';
import { Err } from '@/common/api-message';
import { compareNewest, uniqueIds } from '@/common/utils';

const connectIds = (ids: string[]) => ids.map((id) => ({ id }));

const MEDIA_ORDER_BY: Prisma.MediaOrderByWithRelationInput[] = [
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
  media: {
    where: { deletedAt: null },
    select: { id: true },
  },
  subalbums: { select: { id: true } },
  group: { select: { id: true } },
  _count: {
    select: {
      media: { where: { deletedAt: null } },
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
  media: {
    // Only displayable media can serve as a cover thumbnail.
    where: { deletedAt: null, thumbnailPath: { not: null } },
    orderBy: MEDIA_ORDER_BY,
    take: 1,
    select: { id: true },
  },
  _count: {
    select: {
      media: { where: { deletedAt: null } },
      subalbums: true,
    },
  },
} satisfies Prisma.AlbumSelect;

const ALBUM_SEARCH_SELECT = {
  id: true,
  name: true,
  parentId: true,
} satisfies Prisma.AlbumSelect;

type AlbumResponseRecord = Prisma.AlbumGetPayload<{
  select: typeof ALBUM_RESPONSE_SELECT;
}>;

type GalleryAlbumRecord = Prisma.AlbumGetPayload<{
  select: typeof GALLERY_ALBUM_SELECT;
}>;

type AlbumSearchRecord = Prisma.AlbumGetPayload<{
  select: typeof ALBUM_SEARCH_SELECT;
}>;

@Injectable()
export class AlbumService {
  constructor(private readonly prisma: PrismaService) {}

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
      photoIds: album.media.map((media) => media.id),
      groupIds: album.group.map((group) => group.id),
      photoCount: album._count.media,
      subalbumCount: album._count.subalbums,
    };
  }

  toGalleryItemResponse(album: GalleryAlbumRecord): GalleryImageResponse {
    const coverMediaId = album.media[0]?.id;

    return {
      id: album.id,
      type: 'album',
      name: album.name,
      thumbnailPath: coverMediaId ? `${API_PREFIX_PATH}/gallery/photo/${coverMediaId}/thumbnail` : undefined,
      capturedAt: album.capturedAt,
      createdAt: album.createdAt,
      parentAlbumId: album.parentId,
      photoCount: album._count.media,
      subalbumCount: album._count.subalbums,
    };
  }

  private async findOwnedAlbumOrThrow(id: string, ownerId: string) {
    const album = await this.prisma.album.findFirst({
      where: { id, ownerId },
      select: { id: true, parentId: true, capturedAt: true },
    });

    if (!album) {
      throw Err.NotFound('api.albums.Err.NotFound');
    }

    return album;
  }

  private async ensureParentExists(parentId: string, ownerId: string) {
    const parent = await this.prisma.album.findFirst({
      where: { id: parentId, ownerId },
      select: { id: true },
    });

    if (!parent) {
      throw Err.NotFound('api.albums.parentErr.NotFound');
    }
  }

  private async ensureNoCycle(albumId: string, parentId: string | null | undefined, ownerId: string) {
    if (!parentId) {
      return;
    }

    if (parentId === albumId) {
      throw Err.BadRequest('api.albums.selfParent');
    }

    let currentParentId: string | null | undefined = parentId;

    while (currentParentId) {
      if (currentParentId === albumId) {
        throw Err.BadRequest('api.albums.cycle');
      }

      const album = await this.prisma.album.findFirst({
        where: { id: currentParentId, ownerId },
        select: { parentId: true },
      });

      if (!album) {
        throw Err.NotFound('api.albums.parentErr.NotFound');
      }

      currentParentId = album.parentId;
    }
  }

  private async ensureOwnedPhotos(photoIds: string[], ownerId: string) {
    if (!photoIds.length) {
      return;
    }

    const count = await this.prisma.media.count({
      where: {
        id: { in: photoIds },
        ownerId,
        deletedAt: null,
      },
    });

    if (count !== photoIds.length) {
      throw Err.BadRequest('api.albums.photosMissing');
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
      throw Err.BadRequest('api.albums.groupsMissing');
    }
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
        this.prisma.media.findFirst({
          where: {
            deletedAt: null,
            albums: {
              some: { id: currentAlbum.id },
            },
          },
          orderBy: MEDIA_ORDER_BY,
          select: { capturedAt: true },
        }),
        this.prisma.album.aggregate({
          where: { parentId: currentAlbum.id },
          _max: { capturedAt: true },
        }),
      ]);

      const dates = [latestPhoto?.capturedAt, latestSubalbum._max.capturedAt].filter((date): date is Date => !!date);
      const nextCapturedAt = dates.length ? new Date(Math.max(...dates.map(Number))) : null;
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

  async findIdsForMedia(mediaIds: string[]) {
    const ids = uniqueIds(mediaIds);
    if (!ids.length) {
      return [];
    }

    const albums = await this.prisma.album.findMany({
      where: { media: { some: { id: { in: ids } } } },
      select: { id: true },
    });

    return albums.map((album) => album.id);
  }

  async refreshAlbums(albumIds: string[]) {
    for (const albumId of uniqueIds(albumIds)) {
      await this.refreshAlbumCapturedAtCascade(albumId);
    }
  }

  async refreshCapturedAtForMedia(mediaIds: string[]) {
    await this.refreshAlbums(await this.findIdsForMedia(mediaIds));
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

    return albums.sort(compareNewest).slice(0, take);
  }

  async create(createAlbumDto: CreateAlbumRequest, user: TokenPayload) {
    const photoIds = uniqueIds(createAlbumDto.photoIds);
    const groupIds = uniqueIds(createAlbumDto.groupIds);
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
        media: photoIds.length ? { connect: connectIds(photoIds) } : undefined,
        group: groupIds.length ? { connect: connectIds(groupIds) } : undefined,
      },
      select: { id: true },
    });

    await this.refreshAlbumCapturedAtCascade(createdAlbum.id);
    return this.findOne(createdAlbum.id, user);
  }

  async addPhotos(id: string, dto: AddPhotosToAlbumRequest, user: TokenPayload) {
    const album = await this.findOwnedAlbumOrThrow(id, user.sub);
    const photoIds = uniqueIds(dto.photoIds);
    await this.ensureOwnedPhotos(photoIds, user.sub);

    if (photoIds.length) {
      await this.prisma.album.update({
        where: { id: album.id },
        data: { media: { connect: connectIds(photoIds) } },
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

  async search(query: SearchAlbumsRequest, user: TokenPayload): Promise<AlbumSearchResponse[]> {
    const searchQuery = query.query.trim();
    if (!searchQuery) {
      return [];
    }

    const matchingAlbums = await this.prisma.album.findMany({
      where: {
        ownerId: user.sub,
        deletedAt: null,
        name: { contains: searchQuery, mode: 'insensitive' },
      },
      orderBy: [{ capturedAt: 'desc' }, { createdAt: 'desc' }, { name: 'asc' }],
      take: query.limit ?? 50,
      select: ALBUM_SEARCH_SELECT,
    });

    const albumsById = new Map<string, AlbumSearchRecord>(matchingAlbums.map((album) => [album.id, album]));
    const unseenParentIds = (albums: AlbumSearchRecord[]) =>
      albums.flatMap((album) => (album.parentId && !albumsById.has(album.parentId) ? [album.parentId] : []));
    let parentIds = unseenParentIds(matchingAlbums);

    while (parentIds.length > 0) {
      const parentAlbums = await this.prisma.album.findMany({
        where: {
          id: { in: parentIds },
          ownerId: user.sub,
          deletedAt: null,
        },
        select: ALBUM_SEARCH_SELECT,
      });

      if (!parentAlbums.length) {
        break;
      }

      parentAlbums.forEach((album) => albumsById.set(album.id, album));
      parentIds = unseenParentIds(parentAlbums);
    }

    return matchingAlbums.map((album) => {
      const path = [];
      const visitedIds = new Set<string>();
      let currentAlbum: AlbumSearchRecord | undefined = album;

      while (currentAlbum && !visitedIds.has(currentAlbum.id)) {
        path.push({ id: currentAlbum.id, name: currentAlbum.name });
        visitedIds.add(currentAlbum.id);
        currentAlbum = currentAlbum.parentId ? albumsById.get(currentAlbum.parentId) : undefined;
      }

      return {
        id: album.id,
        name: album.name,
        parentId: album.parentId,
        path: path.reverse(),
      };
    });
  }

  async findOne(id: string, user: TokenPayload) {
    const album = await this.prisma.album.findFirst({
      where: { id, ownerId: user.sub, deletedAt: null },
      select: ALBUM_RESPONSE_SELECT,
    });

    if (!album) {
      throw Err.NotFound('api.albums.Err.NotFound');
    }

    return this.mapAlbumResponse(album);
  }

  async update(id: string, updateAlbumDto: UpdateAlbumRequest, user: TokenPayload) {
    const existingAlbum = await this.findOwnedAlbumOrThrow(id, user.sub);
    const photoIds = updateAlbumDto.photoIds !== undefined ? uniqueIds(updateAlbumDto.photoIds) : undefined;
    const groupIds = updateAlbumDto.groupIds !== undefined ? uniqueIds(updateAlbumDto.groupIds) : undefined;
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
        ...(photoIds !== undefined ? { media: { set: connectIds(photoIds) } } : {}),
        ...(groupIds !== undefined ? { group: { set: connectIds(groupIds) } } : {}),
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
