import { ApiClient, ApiClientOptions } from './_client';
import { buildQuery } from '../utils/requests';
import {
  type AddGroupMemberRequest,
  type AddGroupMembersRequest,
  type AddPhotosToAlbumRequest,
  type AlbumResponse,
  type AuthResponse,
  type BackupResponse,
  type CopyFileRequest,
  type CreateAlbumRequest,
  type CreateBackupRequest,
  type CreateFileRequest,
  type CreateGroupRequest,
  type CreateFolderRequest,
  type DownloadFileRequest,
  type FileActionResponse,
  type FileResponse,
  type FindAlbumsRequest,
  type FindAllFilesRequest,
  type FindFileRequest,
  type FindGalleryImagesRequest,
  type GalleryImageResponse,
  type GalleryImagePageResponse,
  type GalleryScanResponse,
  type GalleryStatsResponse,
  type GroupResponse,
  type MoveFileRequest,
  type NoteResponse,
  type PhotoBulkActionRequest,
  type PhotoBulkActionResponse,
  type RefreshResponse,
  type RemoveGroupMemberRequest,
  type RemoveFileRequest,
  type CreateNoteRequest,
  type UpdateAlbumRequest,
  type UpdateBackupRequest,
  type UpdateGroupRequest,
  type UpdateGroupMemberRequest,
  type UpdateNoteRequest,
  type UserResponse,
} from '@repo/shared';

export const endpoints = {
  auth: '/auth',
  login: '/auth/login',
  refresh: '/auth/refresh',
  register: '/auth/register',
  users: '/users',
  backups: '/backups',
  groups: '/groups',
  notes: '/notes',
  files: '/files',
  gallery: '/gallery',
  album: '/gallery/album',
  photo: '/gallery/photo',
};

export type Options = ApiClientOptions & {
  email?: string;
  password?: string;
};

export class CoreApiClient extends ApiClient<UserResponse> {
  constructor(options: Options) {
    super({ ...options });
    if (options.email && options.password) {
      void this.startLogin(() => this.login(options.email!, options.password!));
    }
  }

  private async login(email: string, password: string) {
    const response = await fetch(`${this.baseUrl}${endpoints.login}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Login failed: ${response.status} ${response.statusText} - ${errorText}`);
    }
    const result = (await response.json()) as AuthResponse;
    this.accessToken = result.accessToken;
    this.refreshToken = result.refreshToken;
    this.account = result.user;
    this.saveRefreshToken(result.refreshToken);
  }

  public override async reconnect() {
    return this.startLogin(() => this.refreshTokens());
  }

  private async refreshTokens() {
    const refreshToken = this.refreshToken;
    if (!refreshToken) {
      return false;
    }
    const response = await fetch(`${this.baseUrl}${endpoints.refresh}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!response.ok) {
      return false;
    }
    const refreshed = (await response.json()) as RefreshResponse;
    this.accessToken = refreshed.accessToken;
    this.refreshToken = refreshed.refreshToken;
    this.saveRefreshToken(refreshed.refreshToken);
    return true;
  }

  public readonly files = {
    find: (dto: FindFileRequest) => this.get<FileResponse>(buildQuery(endpoints.files, { ...dto })),
    findAll: (dto: FindAllFilesRequest) =>
      this.post<FindAllFilesRequest, FileResponse[]>(`${endpoints.files}/all`, dto),
    createFile: async (dto: CreateFileRequest, file: Blob, fileName: string) => {
      const formData = new FormData();
      formData.append('newPath', dto.newPath);
      formData.append('name', dto.name);
      formData.append('groupId', dto.groupId);
      formData.append('file', file, fileName);
      return this.postFormData<FileActionResponse>(endpoints.files, formData);
    },
    createFolder: (dto: CreateFolderRequest) =>
      this.post<CreateFolderRequest, FileActionResponse>(`${endpoints.files}/folder`, dto),
    move: (dto: MoveFileRequest) => this.patch<MoveFileRequest, FileActionResponse>(endpoints.files, dto),
    copy: (dto: CopyFileRequest) => this.post<CopyFileRequest, FileActionResponse>(`${endpoints.files}/copy`, dto),
    remove: (dto: RemoveFileRequest) => this.delete<RemoveFileRequest, FileActionResponse>(endpoints.files, dto),
    download: (dto: DownloadFileRequest) => this.getBlob(buildQuery(`${endpoints.files}/download`, { ...dto })),
  };

  public readonly groups = {
    create: (dto: CreateGroupRequest) => this.post<CreateGroupRequest, GroupResponse>(endpoints.groups, dto),
    addMember: (id: string, dto: AddGroupMemberRequest) =>
      this.patch<AddGroupMemberRequest, GroupResponse>(`${endpoints.groups}/${id}/add_member`, dto),
    addMembers: (id: string, dto: AddGroupMembersRequest) =>
      this.patch<AddGroupMembersRequest, GroupResponse>(`${endpoints.groups}/${id}/add_members`, dto),
    removeMember: (id: string, dto: RemoveGroupMemberRequest) =>
      this.patch<RemoveGroupMemberRequest, GroupResponse>(`${endpoints.groups}/${id}/remove_member`, dto),
    update: (id: string, dto: UpdateGroupRequest) =>
      this.patch<UpdateGroupRequest, GroupResponse>(`${endpoints.groups}/${id}`, dto),
    updateMember: (id: string, dto: UpdateGroupMemberRequest) =>
      this.patch<UpdateGroupMemberRequest, GroupResponse>(`${endpoints.groups}/${id}/update_member`, dto),
    findUserGroups: () => this.get<GroupResponse[]>(endpoints.groups),
    findAll: () => this.get<GroupResponse[]>(`${endpoints.groups}/all`),
    findOne: (id: string) => this.get<GroupResponse>(`${endpoints.groups}/${id}`),
    remove: (id: string) => this.delete<undefined, GroupResponse>(`${endpoints.groups}/${id}`),
  };

  public readonly notes = {
    create: (dto: CreateNoteRequest) => this.post<CreateNoteRequest, NoteResponse>(endpoints.notes, dto),
    findAll: () => this.get<NoteResponse[]>(endpoints.notes),
    findOne: (id: string) => this.get<NoteResponse>(`${endpoints.notes}/${id}`),
    update: (id: string, dto: UpdateNoteRequest) =>
      this.patch<UpdateNoteRequest, NoteResponse>(`${endpoints.notes}/${id}`, dto),
    remove: (id: string) => this.delete<undefined, NoteResponse>(`${endpoints.notes}/${id}`),
  };

  public readonly users = {
    findAll: () => this.get<UserResponse[]>(endpoints.users),
    findOne: (id: string) => this.get<UserResponse>(`${endpoints.users}/${id}`),
    search: (query: string) => this.get<UserResponse[]>(`${endpoints.users}/search/${encodeURIComponent(query)}`),
  };

  public readonly backups = {
    findAll: () => this.get<BackupResponse[]>(endpoints.backups),
    createIncoming: (dto: CreateBackupRequest) =>
      this.post<CreateBackupRequest, BackupResponse>(`${endpoints.backups}/incoming`, dto),
    createOutgoing: (dto: CreateBackupRequest) =>
      this.post<CreateBackupRequest, BackupResponse>(`${endpoints.backups}/outgoing`, dto),
    update: (id: string, dto: UpdateBackupRequest) =>
      this.patch<UpdateBackupRequest, BackupResponse>(`${endpoints.backups}/${id}`, dto),
    trigger: (id: string) => this.post<undefined, BackupResponse>(`${endpoints.backups}/${id}/trigger`),
    remove: (id: string) => this.delete<undefined, BackupResponse>(`${endpoints.backups}/${id}`),
  };

  public readonly gallery = {
    findAll: (dto?: FindGalleryImagesRequest) =>
      this.get<GalleryImagePageResponse>(buildQuery(endpoints.gallery, { ...(dto ?? {}) })),
    getStats: () => this.get<GalleryStatsResponse>(`${endpoints.gallery}/stats`),
    scan: () => this.post<undefined, GalleryScanResponse>(`${endpoints.gallery}/scan`),
  };

  public readonly album = {
    create: (dto: CreateAlbumRequest) => this.post<CreateAlbumRequest, AlbumResponse>(endpoints.album, dto),
    findAll: (dto?: FindAlbumsRequest) => this.get<AlbumResponse[]>(buildQuery(endpoints.album, { ...(dto ?? {}) })),
    findOne: (id: string) => this.get<AlbumResponse>(`${endpoints.album}/${id}`),
    addPhotos: (id: string, dto: AddPhotosToAlbumRequest) =>
      this.post<AddPhotosToAlbumRequest, AlbumResponse>(`${endpoints.album}/${id}/photos`, dto),
    update: (id: string, dto: UpdateAlbumRequest) =>
      this.patch<UpdateAlbumRequest, AlbumResponse>(`${endpoints.album}/${id}`, dto),
    remove: (id: string) => this.delete<undefined, AlbumResponse>(`${endpoints.album}/${id}`),
  };

  public readonly photo = {
    findOne: (id: string) => this.get<GalleryImageResponse>(`${endpoints.photo}/${id}`),
    uploadFile: (file: Blob, fileName: string) => {
      const formData = new FormData();
      formData.append('file', file, fileName);
      return this.postFormData(endpoints.photo, formData);
    },
    trashMany: (dto: PhotoBulkActionRequest) =>
      this.patch<PhotoBulkActionRequest, PhotoBulkActionResponse>(`${endpoints.photo}/trash`, dto),
    restoreMany: (dto: PhotoBulkActionRequest) =>
      this.patch<PhotoBulkActionRequest, PhotoBulkActionResponse>(`${endpoints.photo}/restore`, dto),
    restoreAll: () => this.patch<undefined, PhotoBulkActionResponse>(`${endpoints.photo}/restore-all`),
    removeManyPermanently: (dto: PhotoBulkActionRequest) =>
      this.delete<PhotoBulkActionRequest, PhotoBulkActionResponse>(`${endpoints.photo}/permanent`, dto),
    removeAllTrashed: () => this.delete<undefined, PhotoBulkActionResponse>(`${endpoints.photo}/trash`),
    remove: (id: string) => this.delete<undefined, unknown>(`${endpoints.photo}/${id}`),
  };
}
