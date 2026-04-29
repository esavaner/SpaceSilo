import { ApiClient, ApiClientOptions } from './_client';
import { buildQuery } from '../utils/requests';
import {
  type AddGroupMemberRequest,
  type AddGroupMembersRequest,
  type AuthResponse,
  type CopyFileRequest,
  type CreateFileRequest,
  type CreateGroupRequest,
  type CreateFolderRequest,
  type DownloadFileRequest,
  type FileActionResponse,
  type FileResponse,
  type FindAllFilesRequest,
  type FindFileRequest,
  type GalleryImageResponse,
  type GalleryScanResponse,
  type GalleryStatsResponse,
  type GroupResponse,
  type MoveFileRequest,
  type RefreshResponse,
  type RemoveGroupMemberRequest,
  type RemoveFileRequest,
  type UpdateGroupMemberRequest,
  type UserResponse,
} from '@repo/shared';

export const endpoints = {
  auth: '/auth',
  login: '/auth/login',
  refresh: '/auth/refresh',
  register: '/auth/register',
  users: '/users',
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
    updateMember: (id: string, dto: UpdateGroupMemberRequest) =>
      this.patch<UpdateGroupMemberRequest, GroupResponse>(`${endpoints.groups}/${id}/update_member`, dto),
    findUserGroups: () => this.get<GroupResponse[]>(endpoints.groups),
    findAll: () => this.get<GroupResponse[]>(`${endpoints.groups}/all`),
    findOne: (id: string) => this.get<GroupResponse>(`${endpoints.groups}/${id}`),
    remove: (id: string) => this.delete<undefined, GroupResponse>(`${endpoints.groups}/${id}`),
  };

  public readonly gallery = {
    findAll: () => this.get<GalleryImageResponse[]>(endpoints.gallery),
    getStats: () => this.get<GalleryStatsResponse>(`${endpoints.gallery}/stats`),
    scan: () => this.post<undefined, GalleryScanResponse>(`${endpoints.gallery}/scan`),
    findOne: (id: string) => this.get<GalleryImageResponse>(`${endpoints.gallery}/${id}`),
    uploadFile: (file: Blob, fileName: string) => {
      const formData = new FormData();
      formData.append('file', file, fileName);
      return this.postFormData(endpoints.gallery, formData);
    },
  };
}
