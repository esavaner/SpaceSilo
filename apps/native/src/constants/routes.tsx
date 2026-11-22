import { Icon, type LucideIcon } from '@repo/shared/components';

export const routes = {
  index: 'index',
  gallery: 'gallery',
  trash: 'trash',
  files: 'files',
  notes: 'notes',
  groups: 'groups',
  backups: 'backups',
  settings: 'settings',
} as const;

export const routeLabels: Record<keyof typeof routes, string> = {
  [routes.index]: 'navigation.dashboard',
  [routes.gallery]: 'navigation.gallery',
  [routes.trash]: 'navigation.trash',
  [routes.files]: 'navigation.files',
  [routes.notes]: 'navigation.notes',
  [routes.groups]: 'navigation.groups',
  [routes.backups]: 'navigation.backups',
  [routes.settings]: 'navigation.settings',
};

export const routeIcons: Record<keyof typeof routes, LucideIcon> = {
  [routes.index]: Icon.LayoutDashboard,
  [routes.gallery]: Icon.Image,
  [routes.trash]: Icon.Trash,
  [routes.files]: Icon.Folder,
  [routes.notes]: Icon.FileText,
  [routes.groups]: Icon.Users,
  [routes.backups]: Icon.DatabaseBackup,
  [routes.settings]: Icon.Settings,
};
