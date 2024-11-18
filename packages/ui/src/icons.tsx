import FIcon from '@expo/vector-icons/Feather';
import Fa6Icon from '@expo/vector-icons/FontAwesome6';
import MIcon from '@expo/vector-icons/MaterialIcons';
import { cssInterop } from 'nativewind';
import React from 'react';

type IconProps = Omit<React.ComponentProps<typeof FIcon> & React.ComponentProps<typeof MIcon>, 'name'>;

const d = {
  size: 24,
  className: 'text-content',
};

cssInterop(FIcon, {
  className: {
    target: 'style',
  },
});

cssInterop(MIcon, {
  className: {
    target: 'style',
  },
});

cssInterop(Fa6Icon, {
  className: {
    target: 'style',
  },
});

export const AddIcon = (p: IconProps) => <FIcon name="plus" {...d} {...p} />;
export const ChevronRightIcon = (p: IconProps) => <FIcon name="chevron-right" {...d} {...p} />;
export const CloseIcon = (p: IconProps) => <FIcon name="x" {...d} {...p} />;
export const CopyIcon = (p: IconProps) => <FIcon name="copy" {...d} {...p} />;
export const EditIcon = (p: IconProps) => <FIcon name="edit-3" {...d} {...p} />;
export const EllipsisIcon = (p: IconProps) => <Fa6Icon name="ellipsis-vertical" {...d} {...p} />;
export const FileIcon = (p: IconProps) => <MIcon name="insert-drive-file" {...d} {...p} />;
export const FolderIcon = (p: IconProps) => <MIcon name="folder" {...d} {...p} />;
export const HomeIcon = (p: IconProps) => <MIcon name="home" {...d} {...p} />;
export const InfoIcon = (p: IconProps) => <FIcon name="info" {...d} {...p} />;
export const MenuIcon = (p: IconProps) => <FIcon name="menu" {...d} {...p} />;
export const MoveIcon = (p: IconProps) => <MIcon name="drive-file-move-rtl" {...d} {...p} />;
export const NavigateNextIcon = (p: IconProps) => <MIcon name="navigate-next" {...d} {...p} />;
export const PersonIcon = (p: IconProps) => <MIcon name="person" {...d} {...p} />;
export const SearchIcon = (p: IconProps) => <FIcon name="search" {...d} {...p} />;
export const SettingsIcon = (p: IconProps) => <FIcon name="settings" {...d} {...p} />;
export const ShareIcon = (p: IconProps) => <FIcon name="share" {...d} {...p} />;
export const TrashIcon = (p: IconProps) => <FIcon name="trash-2" {...d} {...p} />;