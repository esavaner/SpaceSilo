import { Button, type ButtonProps } from '@/components/general/button';
import { Icon } from '@/components/general/icon';
import { Text } from '@/components/general/text';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from './dropdown';
import { View } from 'react-native';

export type IncludedGroupOption = {
  key: string;
  label: string;
  serverLabel?: string;
};

type IncludedGroupsDropdownProps = {
  options: IncludedGroupOption[];
  includedKeys: string[];
  title: string;
  includeLabel: string;
  emptyLabel: string;
  onToggleIncluded: (key: string) => void;
  buttonClassName?: string;
  buttonVariant?: ButtonProps['variant'];
};

export const IncludedGroupsDropdown = ({
  options,
  includedKeys,
  title,
  includeLabel,
  emptyLabel,
  onToggleIncluded,
  buttonClassName,
  buttonVariant,
}: IncludedGroupsDropdownProps) => {
  const includedKeySet = new Set(includedKeys);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button variant={buttonVariant} className={buttonClassName}>
          <Icon.Filter className="text-foreground" />
          <Text>{title}</Text>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-56">
        <DropdownMenuLabel>{includeLabel}</DropdownMenuLabel>
        {options.length > 0 ? (
          options.map((option) => (
            <DropdownMenuCheckboxItem
              key={option.key}
              checked={includedKeySet.has(option.key)}
              onCheckedChange={() => onToggleIncluded(option.key)}
            >
              <View className="flex-1 gap-0.5">
                <Text>{option.label}</Text>
                {option.serverLabel ? (
                  <Text className="text-muted-foreground text-xs">{option.serverLabel}</Text>
                ) : null}
              </View>
            </DropdownMenuCheckboxItem>
          ))
        ) : (
          <Text className="px-2 py-1.5 text-sm text-muted-foreground">{emptyLabel}</Text>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
