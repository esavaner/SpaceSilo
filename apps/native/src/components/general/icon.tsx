import { cn } from '@/utils/cn';
import DropboxLogo from '@/assets/images/dropbox.svg';
import GoogleDriveLogo from '@/assets/images/google_drive.svg';
import CoreLogo from '@/assets/images/database.svg';
import { Image as ExpoImage } from 'expo-image';
import type { ComponentType } from 'react';
import type { LucideIcon, LucideProps } from 'lucide-react-native';
import {
  AlertOctagon,
  AlertTriangle,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Code,
  Copy,
  DatabaseBackup,
  Edit3,
  EllipsisVertical,
  FileText,
  Filter,
  Folder,
  FolderInput,
  Home,
  Image,
  Info,
  LayoutDashboard,
  LoaderCircle,
  Menu,
  PencilLine,
  Plus,
  Search,
  Settings,
  Share,
  Trash2,
  User,
  Users,
  X,
} from 'lucide-react-native';

type IconBaseProps = LucideProps & {
  className?: string;
  'data-testid'?: string;
};

type IconProps = IconBaseProps & {
  as: LucideIcon;
};

const renderIcon = ({ as: IconComponent, className, size = 18, ...props }: IconProps) => {
  const Component = IconComponent as ComponentType<IconBaseProps>;
  return <Component {...props} className={cn('text-foreground', className)} size={size} />;
};

const create = (as: LucideIcon) => {
  return (props: IconBaseProps) => renderIcon({ as, ...props });
};

const createCustom = (source: number) => {
  const CustomIcon = ({ className, size = 18, 'data-testid': dataTestId }: IconBaseProps) => {
    const iconSize = typeof size === 'number' ? size : Number(size) || 18;
    return (
      <ExpoImage
        source={source}
        className={className}
        style={{ width: iconSize, height: iconSize }}
        contentFit="contain"
        testID={dataTestId}
      />
    );
  };
  return CustomIcon;
};

export const Icon = Object.assign((props: IconProps) => renderIcon(props), {
  AlertOctagon: create(AlertOctagon),
  AlertTriangle: create(AlertTriangle),
  Add: create(Plus),
  Backup: create(DatabaseBackup),
  CheckCircle: create(CheckCircle),
  Check: create(Check),
  ChevronDown: create(ChevronDown),
  ChevronUp: create(ChevronUp),
  Close: create(X),
  Copy: create(Copy),
  Edit: create(Edit3),
  Rename: create(PencilLine),
  Ellipsis: create(EllipsisVertical),
  File: create(FileText),
  Filter: create(Filter),
  Folder: create(Folder),
  Home: create(Home),
  Image: create(Image),
  Info: create(Info),
  Layout: create(LayoutDashboard),
  Loader: create(LoaderCircle),
  Menu: create(Menu),
  Move: create(FolderInput),
  NavigateNext: create(ChevronRight),
  Person: create(User),
  Search: create(Search),
  Settings: create(Settings),
  Share: create(Share),
  Trash: create(Trash2),
  UserGroup: create(Users),
  Code: create(Code),

  // Custom icons
  Dropbox: createCustom(DropboxLogo),
  GoogleDrive: createCustom(GoogleDriveLogo),
  Core: createCustom(CoreLogo),
});
