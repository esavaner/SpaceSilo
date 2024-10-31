/* eslint-disable */
/* tslint:disable */
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export type CreatePhotoDto = object;

export type CreateAlbumDto = object;

export type UpdateAlbumDto = object;

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  role: string;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  password?: string;
  role?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
}

export interface CreateFileDto {
  path: string;
}

export type CreateNoteDto = object;

export type UpdateNoteDto = object;

import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, HeadersDefaults, ResponseType } from 'axios';
import axios from 'axios';

export type QueryParamsType = Record<string | number, any>;

export interface FullRequestParams extends Omit<AxiosRequestConfig, 'data' | 'params' | 'url' | 'responseType'> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseType;
  /** request body */
  body?: unknown;
}

export type RequestParams = Omit<FullRequestParams, 'body' | 'method' | 'query' | 'path'>;

export interface ApiConfig<SecurityDataType = unknown> extends Omit<AxiosRequestConfig, 'data' | 'cancelToken'> {
  securityWorker?: (
    securityData: SecurityDataType | null
  ) => Promise<AxiosRequestConfig | void> | AxiosRequestConfig | void;
  secure?: boolean;
  format?: ResponseType;
}

export enum ContentType {
  Json = 'application/json',
  FormData = 'multipart/form-data',
  UrlEncoded = 'application/x-www-form-urlencoded',
  Text = 'text/plain',
}

export class HttpClient<SecurityDataType = unknown> {
  public instance: AxiosInstance;
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>['securityWorker'];
  private secure?: boolean;
  private format?: ResponseType;

  constructor({ securityWorker, secure, format, ...axiosConfig }: ApiConfig<SecurityDataType> = {}) {
    this.instance = axios.create({ ...axiosConfig, baseURL: axiosConfig.baseURL || '' });
    this.secure = secure;
    this.format = format;
    this.securityWorker = securityWorker;
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected mergeRequestParams(params1: AxiosRequestConfig, params2?: AxiosRequestConfig): AxiosRequestConfig {
    const method = params1.method || (params2 && params2.method);

    return {
      ...this.instance.defaults,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...((method && this.instance.defaults.headers[method.toLowerCase() as keyof HeadersDefaults]) || {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected stringifyFormItem(formItem: unknown) {
    if (typeof formItem === 'object' && formItem !== null) {
      return JSON.stringify(formItem);
    } else {
      return `${formItem}`;
    }
  }

  protected createFormData(input: Record<string, unknown>): FormData {
    if (input instanceof FormData) {
      return input;
    }
    return Object.keys(input || {}).reduce((formData, key) => {
      const property = input[key];
      const propertyContent: any[] = property instanceof Array ? property : [property];

      for (const formItem of propertyContent) {
        const isFileType = formItem instanceof Blob || formItem instanceof File;
        formData.append(key, isFileType ? formItem : this.stringifyFormItem(formItem));
      }

      return formData;
    }, new FormData());
  }

  public request = async <T = any, _E = any>({
    secure,
    path,
    type,
    query,
    format,
    body,
    ...params
  }: FullRequestParams): Promise<AxiosResponse<T>> => {
    const secureParams =
      ((typeof secure === 'boolean' ? secure : this.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const responseFormat = format || this.format || undefined;

    if (type === ContentType.FormData && body && body !== null && typeof body === 'object') {
      body = this.createFormData(body as Record<string, unknown>);
    }

    if (type === ContentType.Text && body && body !== null && typeof body !== 'string') {
      body = JSON.stringify(body);
    }

    return this.instance.request({
      ...requestParams,
      headers: {
        ...(requestParams.headers || {}),
        ...(type ? { 'Content-Type': type } : {}),
      },
      params: query,
      responseType: responseFormat,
      data: body,
      url: path,
    });
  };
}

/**
 * @title SpaceSilo API
 * @version 1.0
 * @contact
 *
 * The API description
 */
export class GeneratedApi<SecurityDataType extends unknown> extends HttpClient<SecurityDataType> {
  gallery = {
    /**
     * No description
     *
     * @tags gallery
     * @name GalleryControllerUploadFile
     * @request POST:/gallery
     */
    galleryControllerUploadFile: (data: CreatePhotoDto, params: RequestParams = {}) =>
      this.request<CreatePhotoDto, any>({
        path: `/gallery`,
        method: 'POST',
        body: data,
        type: ContentType.Json,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags gallery
     * @name GalleryControllerFindAll
     * @request GET:/gallery
     */
    galleryControllerFindAll: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/gallery`,
        method: 'GET',
        ...params,
      }),

    /**
     * No description
     *
     * @tags gallery
     * @name GalleryControllerFindOne
     * @request GET:/gallery/{id}
     */
    galleryControllerFindOne: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/gallery/${id}`,
        method: 'GET',
        ...params,
      }),

    /**
     * No description
     *
     * @tags gallery
     * @name GalleryControllerRemove
     * @request DELETE:/gallery/{id}
     */
    galleryControllerRemove: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/gallery/${id}`,
        method: 'DELETE',
        ...params,
      }),

    /**
     * No description
     *
     * @tags gallery
     * @name GalleryControllerFindThumbnail
     * @request GET:/gallery/{id}/thumbnail
     */
    galleryControllerFindThumbnail: (id: string, params: RequestParams = {}) =>
      this.request<CreatePhotoDto, any>({
        path: `/gallery/${id}/thumbnail`,
        method: 'GET',
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags photo
     * @name PhotoControllerUploadFile
     * @request POST:/gallery/photo
     */
    photoControllerUploadFile: (data: CreatePhotoDto, params: RequestParams = {}) =>
      this.request<CreatePhotoDto, any>({
        path: `/gallery/photo`,
        method: 'POST',
        body: data,
        type: ContentType.Json,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags photo
     * @name PhotoControllerFindAll
     * @request GET:/gallery/photo
     */
    photoControllerFindAll: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/gallery/photo`,
        method: 'GET',
        ...params,
      }),

    /**
     * No description
     *
     * @tags photo
     * @name PhotoControllerFindOne
     * @request GET:/gallery/photo/{id}
     */
    photoControllerFindOne: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/gallery/photo/${id}`,
        method: 'GET',
        ...params,
      }),

    /**
     * No description
     *
     * @tags photo
     * @name PhotoControllerRemove
     * @request DELETE:/gallery/photo/{id}
     */
    photoControllerRemove: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/gallery/photo/${id}`,
        method: 'DELETE',
        ...params,
      }),

    /**
     * No description
     *
     * @tags photo
     * @name PhotoControllerFindThumbnail
     * @request GET:/gallery/photo/{id}/thumbnail
     */
    photoControllerFindThumbnail: (id: string, params: RequestParams = {}) =>
      this.request<CreatePhotoDto, any>({
        path: `/gallery/photo/${id}/thumbnail`,
        method: 'GET',
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags album
     * @name AlbumControllerCreate
     * @request POST:/gallery/album
     */
    albumControllerCreate: (data: CreateAlbumDto, params: RequestParams = {}) =>
      this.request<string, any>({
        path: `/gallery/album`,
        method: 'POST',
        body: data,
        type: ContentType.Json,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags album
     * @name AlbumControllerFindAll
     * @request GET:/gallery/album
     */
    albumControllerFindAll: (params: RequestParams = {}) =>
      this.request<string, any>({
        path: `/gallery/album`,
        method: 'GET',
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags album
     * @name AlbumControllerFindOne
     * @request GET:/gallery/album/{id}
     */
    albumControllerFindOne: (id: string, params: RequestParams = {}) =>
      this.request<string, any>({
        path: `/gallery/album/${id}`,
        method: 'GET',
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags album
     * @name AlbumControllerUpdate
     * @request PATCH:/gallery/album/{id}
     */
    albumControllerUpdate: (id: string, data: UpdateAlbumDto, params: RequestParams = {}) =>
      this.request<string, any>({
        path: `/gallery/album/${id}`,
        method: 'PATCH',
        body: data,
        type: ContentType.Json,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags album
     * @name AlbumControllerRemove
     * @request DELETE:/gallery/album/{id}
     */
    albumControllerRemove: (id: string, params: RequestParams = {}) =>
      this.request<string, any>({
        path: `/gallery/album/${id}`,
        method: 'DELETE',
        format: 'json',
        ...params,
      }),
  };
  users = {
    /**
     * No description
     *
     * @tags users
     * @name UsersControllerCreate
     * @request POST:/users
     */
    usersControllerCreate: (data: CreateUserDto, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/users`,
        method: 'POST',
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags users
     * @name UsersControllerFindAll
     * @request GET:/users
     */
    usersControllerFindAll: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/users`,
        method: 'GET',
        ...params,
      }),

    /**
     * No description
     *
     * @tags users
     * @name UsersControllerFindOne
     * @request GET:/users/{id}
     */
    usersControllerFindOne: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/users/${id}`,
        method: 'GET',
        ...params,
      }),

    /**
     * No description
     *
     * @tags users
     * @name UsersControllerUpdate
     * @request PATCH:/users/{id}
     */
    usersControllerUpdate: (id: string, data: UpdateUserDto, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/users/${id}`,
        method: 'PATCH',
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags users
     * @name UsersControllerRemove
     * @request DELETE:/users/{id}
     */
    usersControllerRemove: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/users/${id}`,
        method: 'DELETE',
        ...params,
      }),
  };
  auth = {
    /**
     * No description
     *
     * @tags auth
     * @name AuthControllerLogin
     * @request POST:/auth/login
     */
    authControllerLogin: (data: LoginDto, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/auth/login`,
        method: 'POST',
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags auth
     * @name AuthControllerLogout
     * @request POST:/auth/logout
     */
    authControllerLogout: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/auth/logout`,
        method: 'POST',
        ...params,
      }),

    /**
     * No description
     *
     * @tags auth
     * @name AuthControllerRegister
     * @request POST:/auth/register
     */
    authControllerRegister: (data: RegisterDto, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/auth/register`,
        method: 'POST',
        body: data,
        type: ContentType.Json,
        ...params,
      }),
  };
  files = {
    /**
     * No description
     *
     * @tags files
     * @name FilesControllerUploadFile
     * @request POST:/files
     */
    filesControllerUploadFile: (data: CreateFileDto, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/files`,
        method: 'POST',
        body: data,
        type: ContentType.FormData,
        ...params,
      }),

    /**
     * No description
     *
     * @tags files
     * @name FilesControllerFindAll
     * @request GET:/files
     */
    filesControllerFindAll: (
      query: {
        path: string;
        /** @min 1 */
        take?: number;
        /** @min 1 */
        skip?: number;
      },
      params: RequestParams = {}
    ) =>
      this.request<CreatePhotoDto, any>({
        path: `/files`,
        method: 'GET',
        query: query,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags files
     * @name FilesControllerUpdate
     * @request PATCH:/files
     */
    filesControllerUpdate: (
      query: {
        path: string;
        newPath: string;
      },
      params: RequestParams = {}
    ) =>
      this.request<void, any>({
        path: `/files`,
        method: 'PATCH',
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags files
     * @name FilesControllerRemove
     * @request DELETE:/files
     */
    filesControllerRemove: (
      query: {
        path: string;
      },
      params: RequestParams = {}
    ) =>
      this.request<void, any>({
        path: `/files`,
        method: 'DELETE',
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags files
     * @name FilesControllerDownload
     * @request GET:/files/download
     */
    filesControllerDownload: (
      query: {
        path: string;
      },
      params: RequestParams = {}
    ) =>
      this.request<void, any>({
        path: `/files/download`,
        method: 'GET',
        query: query,
        ...params,
      }),
  };
  notes = {
    /**
     * No description
     *
     * @tags notes
     * @name NotesControllerCreate
     * @request POST:/notes
     */
    notesControllerCreate: (data: CreateNoteDto, params: RequestParams = {}) =>
      this.request<string, any>({
        path: `/notes`,
        method: 'POST',
        body: data,
        type: ContentType.Json,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags notes
     * @name NotesControllerFindAll
     * @request GET:/notes
     */
    notesControllerFindAll: (params: RequestParams = {}) =>
      this.request<string, any>({
        path: `/notes`,
        method: 'GET',
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags notes
     * @name NotesControllerFindOne
     * @request GET:/notes/{id}
     */
    notesControllerFindOne: (id: string, params: RequestParams = {}) =>
      this.request<string, any>({
        path: `/notes/${id}`,
        method: 'GET',
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags notes
     * @name NotesControllerUpdate
     * @request PATCH:/notes/{id}
     */
    notesControllerUpdate: (id: string, data: UpdateNoteDto, params: RequestParams = {}) =>
      this.request<string, any>({
        path: `/notes/${id}`,
        method: 'PATCH',
        body: data,
        type: ContentType.Json,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags notes
     * @name NotesControllerRemove
     * @request DELETE:/notes/{id}
     */
    notesControllerRemove: (id: string, params: RequestParams = {}) =>
      this.request<string, any>({
        path: `/notes/${id}`,
        method: 'DELETE',
        format: 'json',
        ...params,
      }),
  };
}
