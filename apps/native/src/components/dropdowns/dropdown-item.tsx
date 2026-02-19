import type { JSX } from 'react';
import { DropdownMenuItem } from './dropdown';
import { Text } from '../general/text';

type Props = {
  icon?: JSX.Element;
  label?: string;
  onPress?: () => void;
};

export const DropdownItem = ({ icon, label, onPress }: Props) => {
  return (
    <DropdownMenuItem onPress={onPress}>
      {icon}
      <Text>{label}</Text>
    </DropdownMenuItem>
  );
};
