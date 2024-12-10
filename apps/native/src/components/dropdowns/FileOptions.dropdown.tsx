import { FileEntity } from '@/api/generated';
import {
  Button,
  CopyIcon,
  Dropdown,
  DropdownItem,
  EditIcon,
  EllipsisIcon,
  InfoIcon,
  MoveIcon,
  ShareIcon,
  TrashIcon,
  useUi,
} from '@repo/ui';
import { useTranslation } from 'react-i18next';
import { FileRenameModal } from '../modals/FileRename.modal';
import { FileRemoveModal } from '../modals/FileRemove.modal';

type FileOptionsDropdownProps = {
  file: FileEntity;
};

export const FileOptionsDropdown = ({ file }: FileOptionsDropdownProps) => {
  const { t } = useTranslation();
  const { openModal } = useUi();

  const items = [
    { label: t('dropdown.info'), icon: <InfoIcon />, onPress: () => {} },
    { label: t('dropdown.share'), icon: <ShareIcon />, onPress: () => {} },
    {
      label: t('dropdown.rename'),
      icon: <EditIcon />,
      onPress: () => openModal(<FileRenameModal file={file} />),
    },
    { label: t('dropdown.move'), icon: <MoveIcon />, onPress: () => {} },
    { label: t('dropdown.copy'), icon: <CopyIcon />, onPress: () => {} },
    {
      label: t('dropdown.remove'),
      icon: <TrashIcon className="text-red-600" />,
      onPress: () => openModal(<FileRemoveModal files={[file]} />),
    },
  ];

  return (
    <Dropdown
      trigger={(ref, handleOpen) => (
        <Button variant="text" ref={ref} onPress={handleOpen} className="ml-auto">
          <EllipsisIcon />
        </Button>
      )}
    >
      {items.map((item) => (
        <DropdownItem key={item.label} label={item.label} icon={item.icon} onPress={item.onPress} />
      ))}
    </Dropdown>
  );
};
