import { FileEntity } from '@/api/generated';
import {
  Button,
  CopyIcon,
  DropdownItem,
  EditIcon,
  EllipsisIcon,
  InfoIcon,
  ShareIcon,
  TrashIcon,
  useDropdown,
  useUi,
} from '@repo/shared';
import { useTranslation } from 'react-i18next';
import { FileRenameModal } from '../modals/FileRename.modal';
import { FileRemoveModal } from '../modals/FileRemove.modal';
import { FileMoveCopyModal } from '../modals/FileMoveCopy.modal';

type FileOptionsDropdownProps = {
  file: FileEntity;
};

export const FileOptionsDropdown = ({ file }: FileOptionsDropdownProps) => {
  const { t } = useTranslation();
  const { openModal } = useUi();
  const { ref, openDropdown } = useDropdown();

  const items = [
    { label: t('dropdown.info'), icon: <InfoIcon />, onPress: () => {} },
    { label: t('dropdown.share'), icon: <ShareIcon />, onPress: () => {} },
    {
      label: t('dropdown.rename'),
      icon: <EditIcon />,
      onPress: () => openModal(<FileRenameModal file={file} />),
    },
    {
      label: `${t('dropdown.move')} / ${t('dropdown.copy')}`,
      icon: <CopyIcon />,
      onPress: () => openModal(<FileMoveCopyModal selectedItems={[file]} />),
    },
    {
      label: t('dropdown.remove'),
      icon: <TrashIcon className="text-red-600" />,
      onPress: () => openModal(<FileRemoveModal files={[file]} />),
    },
  ];

  const dropdownItems = items.map((item) => (
    <DropdownItem key={item.label} label={item.label} icon={item.icon} onPress={item.onPress} />
  ));

  return (
    <Button variant="icon" ref={ref} onPress={() => openDropdown(dropdownItems)} className="ml-auto">
      <EllipsisIcon />
    </Button>
  );
};
