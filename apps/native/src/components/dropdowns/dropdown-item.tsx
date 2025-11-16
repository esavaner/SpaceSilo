import { LucideIcon } from 'lucide-react-native';
import { Icon } from '../general/icon';
import { DropdownMenuItem } from './dropdown';
import { Text } from '../general/text';

type Props = {
  icon?: LucideIcon;
  label?: string;
  onPress?: () => void;
};

export const DropdownItem = ({ icon, label, onPress }: Props) => {
  return (
    <DropdownMenuItem onPress={onPress}>
      {icon && <Icon as={icon} />}
      <Text>{label}</Text>
    </DropdownMenuItem>
  );
};
