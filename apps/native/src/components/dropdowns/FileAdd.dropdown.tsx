import { FileCreateFolderModal } from '../modals/FileCreateFolder.modal';
import { Button } from '../general/button';
import { Text } from '../general/text';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './dropdown';
import { Icon } from '../general/icon';
import { useUi } from '@/providers/UiProvider';
import { useTranslation } from 'react-i18next';

type FileAddDropdownProps = {
  currentPath: string;
  className?: string;
};

export const FileAddDropdown = ({ currentPath, className }: FileAddDropdownProps) => {
  const { t } = useTranslation();
  const { openModal } = useUi();

  return (
    <DropdownMenu className="ml-auto">
      <DropdownMenuTrigger>
        <Button className={className}>
          <Icon.Add className="text-black" />
          <Text>{t('files.actions.add')}</Text>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onPress={() => openModal(<FileCreateFolderModal currentPath={currentPath} />)}>
          <Icon.Folder />
          <Text>{t('files.actions.folder')}</Text>
        </DropdownMenuItem>
        <DropdownMenuItem
          onPress={() => {
            // handle file creation here
          }}
        >
          <Icon.File />
          <Text>{t('files.actions.file')}</Text>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
