import { ServerType } from '@/api/_client';
import { Icon } from '@/components/general/icon';

export const serverIcons: Record<ServerType, React.ReactNode> = {
  core: <Icon.Core />,
  googleDrive: <Icon.GoogleDrive />,
  dropbox: <Icon.Dropbox />,
};
