import { cn } from '@/utils/cn';
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
  Edit3,
  EllipsisVertical,
  FileText,
  Filter,
  Folder,
  FolderInput,
  Home,
  Info,
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

type IconProps = LucideProps & {
  as: LucideIcon;
};

function renderIcon({ as: IconComponent, className, size = 18, ...props }: IconProps) {
  return <IconComponent {...props} className={cn('text-foreground', className)} size={size} />;
}

function create(as: LucideIcon) {
  return (props: LucideProps) => renderIcon({ as, ...props });
}

export const Icon = Object.assign((props: IconProps) => renderIcon(props), {
  AlertOctagon: create(AlertOctagon),
  AlertTriangle: create(AlertTriangle),
  Add: create(Plus),
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
  Info: create(Info),
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
});
