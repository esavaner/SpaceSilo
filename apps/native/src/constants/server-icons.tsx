import { ServerType } from '@/api/_client';
import { ServerLogo } from '@/components/general/server-logo';

export const serverIcons: Record<ServerType, React.ReactNode> = {
  core: <ServerLogo.Core />,
  googleDrive: <ServerLogo.GoogleDrive />,
  dropbox: <ServerLogo.Dropbox />,
};
