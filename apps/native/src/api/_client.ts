export const ServerType = { CORE: 'core', DROPBOX: 'dropbox', GOOGLE_DRIVE: 'googleDrive' } as const;

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
  refreshToken?: string;
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
  private initializationPromise?: Promise<boolean>;

  constructor({ baseUrl, saveRefreshToken, refreshToken }: ApiClientOptions) {
    this.status = ClientStatus.INITIALIZING;
    this.baseUrl = baseUrl.trim().replace(/\/+$/, '');
    this.saveRefreshToken = saveRefreshToken;
    this.refreshToken = refreshToken;
  }

  protected startLogin(login: () => Promise<void | boolean>) {
    this.status = ClientStatus.INITIALIZING;
    this.loginError = undefined;
    this.initializationPromise = (async () => {
      try {
        const loginResult = await login();
        if (loginResult === false) {
          this.status = ClientStatus.ERROR;
          this.loginError = new Error('Login failed');
          return false;
        }
        this.status = ClientStatus.LOGGED_IN;
        return true;
      } catch (error) {
        this.status = ClientStatus.ERROR;
        this.loginError = error instanceof Error ? error : new Error('Login failed');
        return false;
      }
    })();
    return this.initializationPromise;
  }

  public logout() {
    this.status = ClientStatus.LOGGED_OUT;
    this.accessToken = undefined;
    this.refreshToken = undefined;
    this.saveRefreshToken(undefined);
  }

  public getAuthHeaders(): Record<string, string> {
    if (!this.accessToken) {
      return {};
    }

    return { Authorization: `Bearer ${this.accessToken}` };
  }

  private headersToRecord(headers?: HeadersInit) {
    if (!headers) return {};
    if (headers instanceof Headers) {
      const out: Record<string, string> = {};
      headers.forEach((value, key) => {
        out[key] = value;
      });
      return out;
    }
    return Array.isArray(headers) ? Object.fromEntries(headers) : headers;
  }

  private buildHeaders(config: RequestInit) {
    const headers: Record<string, string> = {
      ...this.headersToRecord(this.defaultConfig.headers),
      ...this.headersToRecord(config.headers),
      ...(this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : {}),
    };

    if (
      !Object.keys(headers).some((key) => key.toLowerCase() === 'content-type') &&
      config.body !== undefined &&
      !(config.body instanceof FormData)
    ) {
      headers['Content-Type'] = 'application/json';
    }

    return headers;
  }

  protected async rawRequest<Res>(path: string, config: RequestInit = {}, unparsed = false) {
    const doFetch = () =>
      fetch(`${this.baseUrl}${path.startsWith('/') ? '' : '/'}${path}`, {
        ...this.defaultConfig,
        ...config,
        headers: this.buildHeaders(config),
      });
    const response = await doFetch();
    if (!response.ok) {
      const errorText = await response.text();
      throw new ApiError(response.status, response.statusText, errorText);
    }
    return unparsed ? (response as Res) : (response.json() as Promise<Res>);
  }

  private async request<Res>(path: string, config: RequestInit = {}, unparsed = false) {
    if (this.initializationPromise) await this.initializationPromise;
    try {
      return await this.rawRequest<Res>(path, config, unparsed);
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401) {
        throw error;
      }
      try {
        const refreshed = await this.reconnect();
        if (!refreshed) {
          this.logout();
          throw error;
        }
        this.status = ClientStatus.LOGGED_IN;
        return this.rawRequest<Res>(path, config, unparsed);
      } catch {
        this.logout();
        throw error;
      }
    }
  }

  public get<Res>(path: string, config?: RequestInit) {
    return this.request<Res>(path, { ...config, method: 'GET' });
  }

  public async getBlob(path: string, config?: RequestInit) {
    const response = await this.request<Response>(path, { ...config, method: 'GET' }, true);
    return response.blob();
  }

  public post<Req, Res>(path: string, body?: Req, config?: RequestInit) {
    return this.request<Res>(path, {
      ...config,
      method: 'POST',
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  }

  public postFormData<Res>(path: string, body: FormData, config?: RequestInit) {
    return this.request<Res>(path, {
      ...config,
      method: 'POST',
      body,
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

  public delete<Req, Res>(path: string, body?: Req, config?: RequestInit) {
    return this.request<Res>(path, {
      ...config,
      method: 'DELETE',
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  }

  public async reconnect() {
    return false;
  }
}
