import { Button, type ButtonProps } from '@/components/general/button';
import { Icon } from '@/components/general/icon';
import { Text } from '@/components/general/text';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown';
import { Fragment } from 'react';

export type IncludedGroupOption = {
  key: string;
  label: string;
  serverId: string;
  serverLabel: string;
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
  const serverGroups = new Map<string, { id: string; label: string; options: IncludedGroupOption[] }>();

  for (const option of options) {
    let serverGroup = serverGroups.get(option.serverId);

    if (!serverGroup) {
      serverGroup = { id: option.serverId, label: option.serverLabel, options: [] };
      serverGroups.set(option.serverId, serverGroup);
    }

    serverGroup.options.push(option);
  }

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
          <>
            <DropdownMenuSeparator />
            {[...serverGroups.values()].map((serverGroup, serverIndex) => (
              <Fragment key={serverGroup.id}>
                {serverIndex > 0 ? <DropdownMenuSeparator /> : null}
                <DropdownMenuLabel className="text-muted-foreground text-xs">{serverGroup.label}</DropdownMenuLabel>
                {serverGroup.options.map((option) => (
                  <DropdownMenuCheckboxItem
                    key={option.key}
                    checked={includedKeySet.has(option.key)}
                    onCheckedChange={() => onToggleIncluded(option.key)}
                  >
                    <Text>{option.label}</Text>
                  </DropdownMenuCheckboxItem>
                ))}
              </Fragment>
            ))}
          </>
        ) : (
          <Text className="px-2 py-1.5 text-sm text-muted-foreground">{emptyLabel}</Text>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
