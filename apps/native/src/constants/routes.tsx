import { FileIcon, UserGroupIcon } from '@/components/icons';
import { JSX } from 'react/jsx-runtime';

export const routes = {
  index: 'index',
  gallery: 'gallery',
  files: 'files',
  notes: 'notes',
  groups: 'groups',
  backups: 'backups',
  rnp: 'rnp',
} as const;

export const routeLabels: Record<keyof typeof routes, string> = {
  [routes.index]: 'Dashboard',
  [routes.gallery]: 'Gallery',
  [routes.files]: 'Files',
  [routes.notes]: 'Notes',
  [routes.groups]: 'Groups',
  [routes.backups]: 'Backups',
  [routes.rnp]: 'RNP Test',
};

export const routeIcons: Record<keyof typeof routes, JSX.Element> = {
  [routes.index]: <FileIcon size={20} />,
  [routes.gallery]: <FileIcon size={20} />,
  [routes.files]: <FileIcon size={20} />,
  [routes.notes]: <FileIcon size={20} />,
  [routes.groups]: <UserGroupIcon size={18} />,
  [routes.backups]: <FileIcon size={20} />,
  [routes.rnp]: <FileIcon size={20} />,
};
