export const ServerType = { CORE: 'core', DROPBOX: 'dropbox' } as const;

export const ClientStatus = {
  LOGGED_OUT: 'logged_out',
  INITIALIZING: 'initializing',
  LOGGED_IN: 'logged_in',
  ERROR: 'error',
} as const;

export type ServerType = (typeof ServerType)[keyof typeof ServerType];
export type ClientStatus = (typeof ClientStatus)[keyof typeof ClientStatus];

class ApiError extends Error {
  public readonly status: number;
  public readonly statusText: string;

  constructor(status: number, statusText: string, body: string) {
    super(`API call failed: ${status} ${statusText} - ${body}`);
    this.status = status;
    this.statusText = statusText;
  }
}

export type ApiClientOptions = {
  baseUrl: string;
  saveRefreshToken: (token: string | undefined) => void;
};

export class ApiClient<TAccount = unknown> {
  public readonly baseUrl: string;
  public status: ClientStatus = ClientStatus.LOGGED_OUT;
  public enabled = true;
  public account?: TAccount;
  public loginError?: Error;

  protected accessToken?: string;
  protected refreshToken?: string;
  protected saveRefreshToken: (token: string | undefined) => void;

  private readonly defaultConfig: RequestInit = {};
  private initializationPromise?: Promise<void>;

  constructor({ baseUrl, saveRefreshToken }: ApiClientOptions) {
    this.status = ClientStatus.INITIALIZING;
    this.baseUrl = baseUrl.trim().replace(/\/+$/, '');
    this.saveRefreshToken = saveRefreshToken;
  }

  protected startLogin(login: () => Promise<void>) {
    this.loginError = undefined;
    this.initializationPromise = (async () => {
      try {
        await login();
        this.status = ClientStatus.LOGGED_IN;
      } catch (error) {
        this.status = ClientStatus.ERROR;
        this.loginError = error instanceof Error ? error : new Error('Login failed');
      }
    })();
  }

  public logout() {
    this.status = ClientStatus.LOGGED_OUT;
    this.accessToken = undefined;
    this.refreshToken = undefined;
    this.saveRefreshToken(undefined);
  }

  protected async refreshTokens() {
    return false;
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
    return Array.isArray(headers) ? Object.fromEntries(headers) : (headers as Record<string, string>);
  }

  protected async rawRequest<Res>(path: string, config: RequestInit = {}) {
    const doFetch = () =>
      fetch(`${this.baseUrl}${path.startsWith('/') ? '' : '/'}${path}`, {
        ...this.defaultConfig,
        ...config,
        headers: {
          'Content-Type': 'application/json',
          ...this.headersToRecord(this.defaultConfig.headers),
          ...this.headersToRecord(config.headers),
          ...(this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : {}),
        },
      });

    const response = await doFetch();
    if (!response.ok) {
      const errorText = await response.text();
      throw new ApiError(response.status, response.statusText, errorText);
    }
    return response.json() as Promise<Res>;
  }

  private async request<Res>(path: string, config: RequestInit = {}) {
    if (this.initializationPromise) await this.initializationPromise;
    try {
      return await this.rawRequest<Res>(path, config);
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401) {
        throw error;
      }
      try {
        const refreshed = await this.refreshTokens();
        if (!refreshed) {
          this.logout();
          throw error;
        }
        this.status = ClientStatus.LOGGED_IN;
        return this.rawRequest<Res>(path, config);
      } catch {
        this.logout();
        throw error;
      }
    }
  }

  public get<Res>(path: string, config?: RequestInit) {
    return this.request<Res>(path, { ...config, method: 'GET' });
  }

  public post<Req, Res>(path: string, body?: Req, config?: RequestInit) {
    return this.request<Res>(path, {
      ...config,
      method: 'POST',
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  }

  public put<Req, Res>(path: string, body?: Req, config?: RequestInit) {
    return this.request<Res>(path, {
      ...config,
      method: 'PUT',
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  }

  public patch<Req, Res>(path: string, body?: Req, config?: RequestInit) {
    return this.request<Res>(path, {
      ...config,
      method: 'PATCH',
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  }

  public delete<Res>(path: string, config?: RequestInit) {
    return this.request<Res>(path, { ...config, method: 'DELETE' });
  }
}
