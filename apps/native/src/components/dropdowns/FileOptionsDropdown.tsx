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

type FileOptionsDropdownProps = {
  file: FileEntity;
};

export const FileOptionsDropdown = ({ file }: FileOptionsDropdownProps) => {
  const { t } = useTranslation();
  const { setCurrentModal } = useUi();

  const modalId = `file-rename-modal-${file.name}`;

  const items = [
    { title: t('dropdown.info'), icon: <InfoIcon />, onPress: () => {} },
    { title: t('dropdown.share'), icon: <ShareIcon />, onPress: () => {} },
    { title: t('dropdown.rename'), icon: <EditIcon />, onPress: () => setCurrentModal(modalId) },
    { title: t('dropdown.copy'), icon: <CopyIcon />, onPress: () => {} },
    { title: t('dropdown.move'), icon: <MoveIcon />, onPress: () => {} },
    { title: t('dropdown.delete'), icon: <TrashIcon className="text-red-600" />, onPress: () => {} },
  ];

  return (
    <>
      <Dropdown id={file.name} trigger={<EllipsisIcon />} className="ml-auto">
        {items.map((item) => (
          <Pressable
            key={item.title}
            className="flex-row justify-between py-3 px-5 w-48 hover:bg-layer active:bg-layer focus:bg-layer"
            onPress={item.onPress}
          >
            {item.icon}
            <Text>{item.title}</Text>
          </Pressable>
        ))}
      </Dropdown>
      <FileRenameModal id={modalId} file={file} />
    </>
  );
};
