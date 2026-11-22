import { ApiClient, ApiError, ClientStatus, createApiError, type ApiClientOptions } from './_client';
import { buildQuery } from '../utils/requests';
import {
  type AddGroupMemberRequest,
  type AddGroupMembersRequest,
  type AddPhotosToAlbumRequest,
  type AlbumResponse,
  type AlbumSearchResponse,
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
  type FileInfoResponse,
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
  type MediaBulkActionRequest,
  type MediaBulkActionResponse,
  type MediaInfoResponse,
  type RefreshResponse,
  type RemoveGroupMemberRequest,
  type RemoveFileRequest,
  type SearchFilesRequest,
  type SessionResponse,
  type CreateNoteRequest,
  type UpdateAlbumRequest,
  type UpdateBackupRequest,
  type UpdateGroupRequest,
  type UpdateGroupMemberRequest,
  type UpdateNoteRequest,
  type UserResponse,
  type UserSearchResponse,
  type FileSearchResponse,
} from '@repo/shared';

export const endpoints = {
  auth: '/auth',
  login: '/auth/login',
  refresh: '/auth/refresh',
  register: '/auth/register',
  logout: '/auth/logout',
  sessions: '/auth/sessions',
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
  loadRefreshToken?: () => Promise<string | undefined>;
  getRefreshLockKey?: () => string | undefined;
};

export function withSessionLock<T>(key: string | undefined, action: () => Promise<T>): Promise<T> {
  if (key && typeof navigator !== 'undefined' && navigator.locks) {
    return navigator.locks.request(`spacesilo-session:${key}`, action);
  }
  return action();
}

export class CoreApiClient extends ApiClient<UserResponse> {
  private readonly loadRefreshToken?: Options['loadRefreshToken'];
  private readonly getRefreshLockKey?: Options['getRefreshLockKey'];
  private reconnectPromise?: Promise<boolean>;
  private unsavedRefreshToken = false;

  constructor(options: Options) {
    super(options);
    this.loadRefreshToken = options.loadRefreshToken;
    this.getRefreshLockKey = options.getRefreshLockKey;
    if (options.email && options.password) {
      void this.startLogin(() => this.login(options.email!, options.password!));
    }
  }

  private async syncRefreshToken() {
    if (this.unsavedRefreshToken) {
      await this.saveRefreshToken(this.refreshToken);
      this.unsavedRefreshToken = false;
      return;
    }
    if (this.loadRefreshToken) {
      this.refreshToken = await this.loadRefreshToken();
    }
  }

  private rawJsonPost(path: string, body: unknown) {
    return fetch(this.buildApiUrl(path), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  private async login(email: string, password: string) {
    const response = await this.rawJsonPost(endpoints.login, { email, password });
    if (!response.ok) {
      throw await createApiError(response);
    }
    const result = (await response.json()) as AuthResponse;
    this.accessToken = result.accessToken;
    this.refreshToken = result.refreshToken;
    this.account = result.user;
    await this.saveRefreshToken(result.refreshToken);
  }

  public override async reconnect() {
    if (!this.reconnectPromise) {
      this.reconnectPromise = withSessionLock(this.getRefreshLockKey?.(), async () => {
        try {
          await this.syncRefreshToken();
          if (!this.refreshToken) {
            await super.logout();
            return false;
          }
          await this.refreshTokens();
          this.status = ClientStatus.LOGGED_IN;
          this.loginError = undefined;
          this.notifyStatusChange();
          return true;
        } catch (error) {
          this.loginError = error instanceof Error ? error : new Error('Refresh failed');
          if (error instanceof ApiError && error.status === 401) {
            await super.logout();
          } else {
            this.status = ClientStatus.ERROR;
            this.notifyStatusChange();
          }
          return false;
        }
      }).finally(() => {
        this.reconnectPromise = undefined;
      });
    }
    return this.reconnectPromise;
  }

  private async refreshTokens() {
    const refreshToken = this.refreshToken;
    if (!refreshToken) {
      return false;
    }
    const response = await this.rawJsonPost(endpoints.refresh, { refreshToken });
    if (!response.ok) {
      throw await createApiError(response);
    }
    const refreshed = (await response.json()) as RefreshResponse | null;
    if (
      !refreshed ||
      typeof refreshed.accessToken !== 'string' ||
      !refreshed.accessToken ||
      typeof refreshed.refreshToken !== 'string' ||
      !refreshed.refreshToken ||
      typeof refreshed.user !== 'object' ||
      !refreshed.user ||
      typeof refreshed.user.id !== 'string' ||
      typeof refreshed.user.email !== 'string' ||
      typeof refreshed.user.role !== 'string'
    ) {
      throw new Error('Invalid refresh response');
    }
    this.accessToken = refreshed.accessToken;
    this.refreshToken = refreshed.refreshToken;
    this.account = refreshed.user;
    this.unsavedRefreshToken = true;
    await this.saveRefreshToken(refreshed.refreshToken);
    this.unsavedRefreshToken = false;
    return true;
  }

  public override async logout() {
    if (this.reconnectPromise) await this.reconnectPromise;
    await withSessionLock(this.getRefreshLockKey?.(), async () => {
      const previousToken = this.refreshToken;
      if (!this.unsavedRefreshToken) await this.syncRefreshToken();
      if (!this.refreshToken) {
        await super.logout();
        this.unsavedRefreshToken = false;
        return;
      }

      const refreshForLogout = async () => {
        try {
          return await this.refreshTokens();
        } catch (error) {
          if (error instanceof ApiError && error.status === 401) return false;
          throw error;
        }
      };

      if ((!this.accessToken || previousToken !== this.refreshToken) && !(await refreshForLogout())) {
        await super.logout();
        this.unsavedRefreshToken = false;
        return;
      }

      try {
        await this.rawRequest<void>(endpoints.logout, { method: 'POST' });
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 401) throw error;
        if (await refreshForLogout()) {
          try {
            await this.rawRequest<void>(endpoints.logout, { method: 'POST' });
          } catch (retryError) {
            if (!(retryError instanceof ApiError) || retryError.status !== 401) throw retryError;
          }
        }
      }
      await super.logout();
      this.unsavedRefreshToken = false;
    });
  }

  public readonly auth = {
    listSessions: () => this.get<SessionResponse[]>(endpoints.sessions),
    revokeSession: (id: string) => this.delete<undefined, void>(`${endpoints.sessions}/${encodeURIComponent(id)}`),
  };

  public readonly files = {
    find: (dto: FindFileRequest) => this.get<FileResponse>(buildQuery(endpoints.files, { ...dto })),
    info: (dto: FindFileRequest) => this.get<FileInfoResponse>(buildQuery(`${endpoints.files}/info`, { ...dto })),
    findAll: (dto: FindAllFilesRequest) =>
      this.post<FindAllFilesRequest, FileResponse[]>(`${endpoints.files}/all`, dto),
    search: (dto: SearchFilesRequest) =>
      this.get<FileSearchResponse[]>(buildQuery(`${endpoints.files}/search`, { ...dto })),
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
    search: (query: string) => this.get<UserSearchResponse[]>(`${endpoints.users}/search/${encodeURIComponent(query)}`),
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
    resetAndScan: () => this.post<undefined, GalleryScanResponse>(`${endpoints.gallery}/reset-and-scan`),
  };

  public readonly album = {
    create: (dto: CreateAlbumRequest) => this.post<CreateAlbumRequest, AlbumResponse>(endpoints.album, dto),
    findAll: (dto?: FindAlbumsRequest) => this.get<AlbumResponse[]>(buildQuery(endpoints.album, { ...(dto ?? {}) })),
    search: (query: string) => this.get<AlbumSearchResponse[]>(buildQuery(`${endpoints.album}/search`, { query })),
    findOne: (id: string) => this.get<AlbumResponse>(`${endpoints.album}/${id}`),
    addPhotos: (id: string, dto: AddPhotosToAlbumRequest) =>
      this.post<AddPhotosToAlbumRequest, AlbumResponse>(`${endpoints.album}/${id}/photos`, dto),
    update: (id: string, dto: UpdateAlbumRequest) =>
      this.patch<UpdateAlbumRequest, AlbumResponse>(`${endpoints.album}/${id}`, dto),
    remove: (id: string) => this.delete<undefined, AlbumResponse>(`${endpoints.album}/${id}`),
  };

  public readonly photo = {
    findOne: (id: string) => this.get<GalleryImageResponse>(`${endpoints.photo}/${id}`),
    info: (id: string) => this.get<MediaInfoResponse>(`${endpoints.photo}/${id}/info`),
    uploadFile: (file: Blob, fileName: string) => {
      const formData = new FormData();
      formData.append('file', file, fileName);
      return this.postFormData(endpoints.photo, formData);
    },
    trashMany: (dto: MediaBulkActionRequest) =>
      this.patch<MediaBulkActionRequest, MediaBulkActionResponse>(`${endpoints.photo}/trash`, dto),
    restoreMany: (dto: MediaBulkActionRequest) =>
      this.patch<MediaBulkActionRequest, MediaBulkActionResponse>(`${endpoints.photo}/restore`, dto),
    restoreAll: () => this.patch<undefined, MediaBulkActionResponse>(`${endpoints.photo}/restore-all`),
    removeManyPermanently: (dto: MediaBulkActionRequest) =>
      this.delete<MediaBulkActionRequest, MediaBulkActionResponse>(`${endpoints.photo}/permanent`, dto),
    removeAllTrashed: () => this.delete<undefined, MediaBulkActionResponse>(`${endpoints.photo}/trash`),
    remove: (id: string) => this.delete<undefined, unknown>(`${endpoints.photo}/${id}`),
  };
}
