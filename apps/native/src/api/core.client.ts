import { ApiClient, ApiClientOptions } from './_client';
import { type AuthResponse, type RefreshResponse, type UserResponse } from '@repo/shared';

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
      this.startLogin(() => this.login(options.email!, options.password!));
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

  protected override async refreshTokens() {
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
}
