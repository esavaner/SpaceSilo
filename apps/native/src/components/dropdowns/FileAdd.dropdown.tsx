import { AddIcon } from '../icons';
import { FileCreateFolderModal } from '../modals/FileCreateFolder.modal';
import { Button } from '../general/button';
import { Text } from '../general/text';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './dropdown';
import { Folder, File } from 'lucide-react-native';
import { Icon } from '../general/icon';
import { useUi } from '@/providers/UiProvider';

type FileAddDropdownProps = {
  currentPath: string;
  className?: string;
};

export const FileAddDropdown = ({ currentPath, className }: FileAddDropdownProps) => {
  const { openModal } = useUi();

  return (
    <DropdownMenu className="ml-auto">
      <DropdownMenuTrigger>
        <Button>
          <AddIcon className="text-primary-foreground" />
          <Text>Add</Text>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onPress={() => openModal(<FileCreateFolderModal currentPath={currentPath} />)}>
          <Icon as={Folder} />
          <Text>Folder</Text>
        </DropdownMenuItem>
        <DropdownMenuItem
          onPress={() => {
            // handle file creation here
          }}
        >
          <Icon as={File} />
          <Text>File</Text>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
