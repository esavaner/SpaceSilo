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
  /** @format email */
  email: string;
  password: string;
}

export interface CreateFileDto {
  path: string;
}

export interface CreateFolderDto {
  path: string;
  name: string;
}

export interface FileEntity {
  name: string;
  uri: string;
  size: number;
  /** @format date-time */
  modificationTime: string;
  isDirectory: boolean;
  md5: string;
}

export type CreateNoteDto = object;

export type UpdateNoteDto = object;

export type QueryParamsType = Record<string | number, any>;
export type ResponseFormat = keyof Omit<Body, 'body' | 'bodyUsed'>;

export interface FullRequestParams extends Omit<RequestInit, 'body'> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseFormat;
  /** request body */
  body?: unknown;
  /** base url */
  baseUrl?: string;
  /** request cancellation token */
  cancelToken?: CancelToken;
}

export type RequestParams = Omit<FullRequestParams, 'body' | 'method' | 'query' | 'path'>;

export interface ApiConfig<SecurityDataType = unknown> {
  baseUrl?: string;
  baseApiParams?: Omit<RequestParams, 'baseUrl' | 'cancelToken' | 'signal'>;
  securityWorker?: (securityData: SecurityDataType | null) => Promise<RequestParams | void> | RequestParams | void;
  customFetch?: typeof fetch;
}

export interface HttpResponse<D extends unknown, E extends unknown = unknown> extends Response {
  data: D;
  error: E;
}

type CancelToken = Symbol | string | number;

export enum ContentType {
  Json = 'application/json',
  FormData = 'multipart/form-data',
  UrlEncoded = 'application/x-www-form-urlencoded',
  Text = 'text/plain',
}

export class HttpClient<SecurityDataType = unknown> {
  public baseUrl: string = '';
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>['securityWorker'];
  private abortControllers = new Map<CancelToken, AbortController>();
  private customFetch = (...fetchParams: Parameters<typeof fetch>) => fetch(...fetchParams);

  private baseApiParams: RequestParams = {
    credentials: 'same-origin',
    headers: {},
    redirect: 'follow',
    referrerPolicy: 'no-referrer',
  };

  constructor(apiConfig: ApiConfig<SecurityDataType> = {}) {
    Object.assign(this, apiConfig);
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected encodeQueryParam(key: string, value: any) {
    const encodedKey = encodeURIComponent(key);
    return `${encodedKey}=${encodeURIComponent(typeof value === 'number' ? value : `${value}`)}`;
  }

  protected addQueryParam(query: QueryParamsType, key: string) {
    return this.encodeQueryParam(key, query[key]);
  }

  protected addArrayQueryParam(query: QueryParamsType, key: string) {
    const value = query[key];
    return value.map((v: any) => this.encodeQueryParam(key, v)).join('&');
  }

  protected toQueryString(rawQuery?: QueryParamsType): string {
    const query = rawQuery || {};
    const keys = Object.keys(query).filter((key) => 'undefined' !== typeof query[key]);
    return keys
      .map((key) => (Array.isArray(query[key]) ? this.addArrayQueryParam(query, key) : this.addQueryParam(query, key)))
      .join('&');
  }

  protected addQueryParams(rawQuery?: QueryParamsType): string {
    const queryString = this.toQueryString(rawQuery);
    return queryString ? `?${queryString}` : '';
  }

  private contentFormatters: Record<ContentType, (input: any) => any> = {
    [ContentType.Json]: (input: any) =>
      input !== null && (typeof input === 'object' || typeof input === 'string') ? JSON.stringify(input) : input,
    [ContentType.Text]: (input: any) => (input !== null && typeof input !== 'string' ? JSON.stringify(input) : input),
    [ContentType.FormData]: (input: any) =>
      Object.keys(input || {}).reduce((formData, key) => {
        const property = input[key];
        formData.append(
          key,
          property instanceof Blob
            ? property
            : typeof property === 'object' && property !== null
              ? JSON.stringify(property)
              : `${property}`
        );
        return formData;
      }, new FormData()),
    [ContentType.UrlEncoded]: (input: any) => this.toQueryString(input),
  };

  protected mergeRequestParams(params1: RequestParams, params2?: RequestParams): RequestParams {
    return {
      ...this.baseApiParams,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...(this.baseApiParams.headers || {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected createAbortSignal = (cancelToken: CancelToken): AbortSignal | undefined => {
    if (this.abortControllers.has(cancelToken)) {
      const abortController = this.abortControllers.get(cancelToken);
      if (abortController) {
        return abortController.signal;
      }
      return void 0;
    }

    const abortController = new AbortController();
    this.abortControllers.set(cancelToken, abortController);
    return abortController.signal;
  };

  public abortRequest = (cancelToken: CancelToken) => {
    const abortController = this.abortControllers.get(cancelToken);

    if (abortController) {
      abortController.abort();
      this.abortControllers.delete(cancelToken);
    }
  };

  public request = async <T = any, E = any>({
    body,
    secure,
    path,
    type,
    query,
    format,
    baseUrl,
    cancelToken,
    ...params
  }: FullRequestParams): Promise<HttpResponse<T, E>> => {
    const secureParams =
      ((typeof secure === 'boolean' ? secure : this.baseApiParams.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const queryString = query && this.toQueryString(query);
    const payloadFormatter = this.contentFormatters[type || ContentType.Json];
    const responseFormat = format || requestParams.format;

    return this.customFetch(`${baseUrl || this.baseUrl || ''}${path}${queryString ? `?${queryString}` : ''}`, {
      ...requestParams,
      headers: {
        ...(requestParams.headers || {}),
        ...(type && type !== ContentType.FormData ? { 'Content-Type': type } : {}),
      },
      signal: (cancelToken ? this.createAbortSignal(cancelToken) : requestParams.signal) || null,
      body: typeof body === 'undefined' || body === null ? null : payloadFormatter(body),
    }).then(async (response) => {
      const r = response.clone() as HttpResponse<T, E>;
      r.data = null as unknown as T;
      r.error = null as unknown as E;

      const data = !responseFormat
        ? r
        : await response[responseFormat]()
            .then((data) => {
              if (r.ok) {
                r.data = data;
              } else {
                r.error = data;
              }
              return r;
            })
            .catch((e) => {
              r.error = e;
              return r;
            });

      if (cancelToken) {
        this.abortControllers.delete(cancelToken);
      }

      if (!response.ok) throw data;
      return data;
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
      this.request<FileEntity[], any>({
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
     * @name FilesControllerMove
     * @request PATCH:/files
     */
    filesControllerMove: (
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
     * @name FilesControllerCreateFolder
     * @request POST:/files/folder
     */
    filesControllerCreateFolder: (data: CreateFolderDto, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/files/folder`,
        method: 'POST',
        body: data,
        type: ContentType.Json,
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
