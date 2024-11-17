import { FileEntity } from '@/api/generated';
import { CopyIcon, EditIcon, EllipsisIcon, InfoIcon, MoveIcon, ShareIcon, TrashIcon } from '@/assets/icons';
import { Dropdown, Text } from '@repo/ui';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import { FileRenameModal } from '../modals/FileRenameModal';

type FileOptionsDropdownProps = {
  file: FileEntity;
};

export const FileOptionsDropdown = ({ file }: FileOptionsDropdownProps) => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  const items = [
    { title: t('dropdown.info'), icon: <InfoIcon />, onPress: () => {} },
    { title: t('dropdown.share'), icon: <ShareIcon />, onPress: () => {} },
    { title: t('dropdown.rename'), icon: <EditIcon />, onPress: () => setVisible(true) },
    { title: t('dropdown.copy'), icon: <CopyIcon />, onPress: () => {} },
    { title: t('dropdown.move'), icon: <MoveIcon />, onPress: () => {} },
    { title: t('dropdown.delete'), icon: <TrashIcon className="text-red-600" />, onPress: () => {} },
  ];

  return (
    <>
      <Dropdown trigger={<EllipsisIcon />} className="ml-auto">
        {items.map((item) => (
          <Pressable
            key={item.title}
            className="flex-row justify-between py-3 px-5 w-48 hover:bg-layer active:bg-layer focus:bg-layer"
            onPress={item.onPress}
          >
            <Text>{item.title}</Text>
            {item.icon}
          </Pressable>
        ))}
      </Dropdown>
      <FileRenameModal visible={visible} onClose={() => setVisible(false)} file={file} />
    </>
  );
};
