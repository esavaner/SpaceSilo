import { Icon } from '@/components/general/icon';
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
  [routes.index]: <Icon.File />,
  [routes.gallery]: <Icon.File />,
  [routes.files]: <Icon.File />,
  [routes.notes]: <Icon.File />,
  [routes.groups]: <Icon.UserGroup />,
  [routes.backups]: <Icon.File />,
  [routes.rnp]: <Icon.File />,
};
