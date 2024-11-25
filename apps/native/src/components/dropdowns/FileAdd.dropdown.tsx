import { AddIcon, Dropdown } from '@repo/ui';
import { View } from 'react-native';

type FileAddDropdownProps = {
  className?: string;
};

export const FileAddDropdown = ({ className }: FileAddDropdownProps) => {
  return (
    <Dropdown
      className={className}
      trigger={
        <View>
          <AddIcon />
        </View>
      }
    ></Dropdown>
  );
};
