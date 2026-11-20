import { Icon, type LucideIcon } from '@repo/shared/components';

export const routes = {
  index: 'index',
  gallery: 'gallery',
  trash: 'trash',
  files: 'files',
  notes: 'notes',
  groups: 'groups',
  backups: 'backups',
} as const;

export const routeLabels: Record<keyof typeof routes, string> = {
  [routes.index]: 'Dashboard',
  [routes.gallery]: 'Gallery',
  [routes.trash]: 'Trash',
  [routes.files]: 'Files',
  [routes.notes]: 'Notes',
  [routes.groups]: 'Groups',
  [routes.backups]: 'Backups',
};

export const routeIcons: Record<keyof typeof routes, LucideIcon> = {
  [routes.index]: Icon.LayoutDashboard,
  [routes.gallery]: Icon.Image,
  [routes.trash]: Icon.Trash,
  [routes.files]: Icon.Folder,
  [routes.notes]: Icon.FileText,
  [routes.groups]: Icon.Users,
  [routes.backups]: Icon.DatabaseBackup,
};
