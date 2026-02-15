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

type ApiClientOptions = {
  baseUrl: string;
  accessToken?: string;
  refreshTokensInStorage?: (accessToken: string, refreshToken: string) => void;
};

export class ApiClient {
  public readonly baseUrl: string;
  private readonly defaultConfig: RequestInit = {};
  private accessToken?: string;
  private refreshTokensInStorage?: (accessToken: string, refreshToken: string) => void;

  constructor(options: ApiClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, '');
    this.accessToken = options.accessToken;
    this.refreshTokensInStorage = options.refreshTokensInStorage;
  }

  private async refreshTokens() {
    this.refreshTokensInStorage?.('', '');
  }

  private headersToRecord(headers?: HeadersInit): Record<string, string> {
    if (!headers) return {};
    if (headers instanceof Headers) {
      const out: Record<string, string> = {};
      headers.forEach((value, key) => {
        out[key] = value;
      });
      return out;
    }
    if (Array.isArray(headers)) {
      return Object.fromEntries(headers);
    }
    return headers as Record<string, string>;
  }

  private async request<Res>(path: string, config: RequestInit = {}) {
    const doFetch = () =>
      fetch(`${this.baseUrl}${path.startsWith('/') ? '' : '/'}${path}`, {
        ...this.defaultConfig,
        ...config,
        headers: {
          'Content-Type': 'application/json',
          ...this.headersToRecord(this.defaultConfig.headers),
          ...this.headersToRecord(config.headers),
          Authorization: this.accessToken ? `Bearer ${this.accessToken}` : '',
        },
      });

    let response = await doFetch();

    if (response.status === 401) {
      await this.refreshTokens();
      response = await doFetch();
    }

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<Res>;
  }

  public get<Res>(path: string, config?: RequestInit) {
    return this.request<Res>(path, { ...config, method: 'GET' });
  }

  public post<Req, Res>(path: string, body: Req, config?: RequestInit) {
    return this.request<Res>(path, {
      ...config,
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  public put<Req, Res>(path: string, body: Req, config?: RequestInit) {
    return this.request<Res>(path, {
      ...config,
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  public patch<Req, Res>(path: string, body: Req, config?: RequestInit) {
    return this.request<Res>(path, {
      ...config,
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  public delete<Res>(path: string, config?: RequestInit) {
    return this.request<Res>(path, { ...config, method: 'DELETE' });
  }
}
