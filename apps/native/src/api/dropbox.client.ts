import { ApiClient, ApiClientOptions } from './_client';

export type DropboxAccount = {
  accountId: string;
  email: string;
  displayName: string;
};

export type DropboxClientOptions = ApiClientOptions & {
  accessToken: string;
};

const DEFAULT_DROPBOX_API_BASE_URL = 'https://api.dropboxapi.com/2';
const CURRENT_ACCOUNT_ENDPOINT = '/users/get_current_account';

export class DropboxClient extends ApiClient<DropboxAccount> {
  constructor(options: DropboxClientOptions) {
    super({ ...options, baseUrl: options.baseUrl ?? DEFAULT_DROPBOX_API_BASE_URL });
    this.startLogin(() => this.login(options.accessToken!));
  }

  private async login(accessToken: string) {
    this.accessToken = accessToken;

    const account = await this.rawRequest<{ account_id: string; email: string; name: { display_name: string } }>(
      CURRENT_ACCOUNT_ENDPOINT,
      {
        method: 'POST',
      }
    );

    this.account = {
      accountId: account.account_id,
      email: account.email,
      displayName: account.name.display_name,
    };
  }
}
