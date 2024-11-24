import { FileEntity } from '@/api/generated';
import {
  CopyIcon,
  Dropdown,
  EditIcon,
  EllipsisIcon,
  InfoIcon,
  MoveIcon,
  ShareIcon,
  Text,
  TrashIcon,
  useUi,
} from '@repo/ui';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import { FileRenameModal } from '../modals/FileRenameModal';
import { FileRemoveModal } from '../modals/FileRemoveModal';

type FileOptionsDropdownProps = {
  file: FileEntity;
};

export const FileOptionsDropdown = ({ file }: FileOptionsDropdownProps) => {
  const { t } = useTranslation();
  const { openModal } = useUi();

  const items = [
    { title: t('dropdown.info'), icon: <InfoIcon />, onPress: () => {} },
    { title: t('dropdown.share'), icon: <ShareIcon />, onPress: () => {} },
    {
      title: t('dropdown.rename'),
      icon: <EditIcon />,
      onPress: () => openModal(<FileRenameModal file={file} />, { title: t('renameItem') }),
    },
    { title: t('dropdown.move'), icon: <MoveIcon />, onPress: () => {} },
    { title: t('dropdown.copy'), icon: <CopyIcon />, onPress: () => {} },
    {
      title: t('dropdown.remove'),
      icon: <TrashIcon className="text-red-600" />,
      onPress: () => openModal(<FileRemoveModal files={[file]} />, { title: t('removeItem') }),
    },
  ];

  return (
    <Dropdown trigger={<EllipsisIcon />} className="ml-auto">
      {items.map((item) => (
        <Pressable
          key={item.title}
          className="flex-row gap-6 py-3 px-5 hover:bg-layer active:bg-layer"
          onPress={item.onPress}
        >
          {item.icon}
          <Text>{item.title}</Text>
        </Pressable>
      ))}
    </Dropdown>
  );
};
