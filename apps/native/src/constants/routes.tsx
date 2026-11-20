import {
  DatabaseBackup,
  FileText,
  Folder,
  Image,
  LayoutDashboard,
  Trash2,
  Users,
  type LucideIcon,
} from 'lucide-react-native';

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
  [routes.index]: LayoutDashboard,
  [routes.gallery]: Image,
  [routes.trash]: Trash2,
  [routes.files]: Folder,
  [routes.notes]: FileText,
  [routes.groups]: Users,
  [routes.backups]: DatabaseBackup,
};
