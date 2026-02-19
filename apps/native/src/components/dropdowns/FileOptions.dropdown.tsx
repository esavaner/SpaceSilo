import { useTranslation } from 'react-i18next';
import { FileRenameModal } from '../modals/FileRename.modal';
import { FileRemoveModal } from '../modals/FileRemove.modal';
import { FileMoveCopyModal } from '../modals/FileMoveCopy.modal';
import { useUi } from '@/providers/UiProvider';
import { DropdownItem } from './dropdown-item';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from './dropdown';
import { Button } from '../general/button';
import { Icon } from '../general/icon';

type FileOptionsDropdownProps = {
  file: any;
};

export const FileOptionsDropdown = ({ file }: FileOptionsDropdownProps) => {
  const { t } = useTranslation();
  const { openModal } = useUi();

  const items = [
    { label: t('dropdown.info'), icon: <Icon.Info />, onPress: () => {} },
    { label: t('dropdown.share'), icon: <Icon.Share />, onPress: () => {} },
    {
      label: t('dropdown.rename'),
      icon: <Icon.Rename />,
      onPress: () => openModal(<FileRenameModal file={file} />),
    },
    {
      label: `${t('dropdown.move')} / ${t('dropdown.copy')}`,
      icon: <Icon.Copy />,
      onPress: () => openModal(<FileMoveCopyModal selectedItems={[file]} />),
    },
    {
      label: t('dropdown.remove'),
      icon: <Icon.Trash />,
      onPress: () => openModal(<FileRemoveModal files={[file]} />),
    },
  ];

  const dropdownItems = items.map((item) => (
    <DropdownItem key={item.label} label={item.label} icon={item.icon} onPress={item.onPress} />
  ));

  return (
    <DropdownMenu className="ml-auto">
      <DropdownMenuTrigger>
        <Button variant="ghost" className="ml-auto">
          <Icon.Ellipsis />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        insets={{
          right: 30,
        }}
      >
        {dropdownItems}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
