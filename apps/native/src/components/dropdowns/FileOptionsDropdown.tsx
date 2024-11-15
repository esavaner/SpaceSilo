import { CopyIcon, EditIcon, EllipsisIcon, InfoIcon, MoveIcon, ShareIcon, TrashIcon } from '@/assets/icons';
import { Dropdown, Text } from '@repo/ui';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';

export const FileOptionsDropdown = () => {
  const { t } = useTranslation();

  const items = [
    { title: t('dropdown.info'), icon: <InfoIcon /> },
    { title: t('dropdown.share'), icon: <ShareIcon /> },
    { title: t('dropdown.rename'), icon: <EditIcon /> },
    { title: t('dropdown.copy'), icon: <CopyIcon /> },
    { title: t('dropdown.move'), icon: <MoveIcon /> },
    { title: t('dropdown.delete'), icon: <TrashIcon className="text-red-600" /> },
  ];

  return (
    <Dropdown trigger={<EllipsisIcon />} className="ml-auto">
      {items.map((item) => (
        <Pressable
          key={item.title}
          className="flex-row justify-between py-3 px-5 w-48 hover:bg-layer active:bg-layer focus:bg-layer"
        >
          <Text>{item.title}</Text>
          {item.icon}
        </Pressable>
      ))}
    </Dropdown>
  );
};
