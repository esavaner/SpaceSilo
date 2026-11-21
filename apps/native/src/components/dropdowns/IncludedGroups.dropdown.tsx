import { Fragment } from 'react';
import styled from 'styled-components/native';
import { Button, DropdownMenu, DropdownOption, Icon, Text, theme, useThemeColors } from '@repo/shared/components';

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
};

const MenuContent = styled.View`
  min-width: 224px;
  gap: ${theme.spacing[200]};
`;

const ServerLabel = styled(Text.S)`
  padding: ${theme.spacing[200]};
`;

const Separator = styled.View`
  height: ${theme.borderWeight[25]};
  background-color: ${theme.colors.border.default};
`;

const CheckSlot = styled.View`
  width: 16px;
`;

export const IncludedGroupsDropdown = ({
  options,
  includedKeys,
  title,
  includeLabel,
  emptyLabel,
  onToggleIncluded,
}: IncludedGroupsDropdownProps) => {
  const colors = useThemeColors();
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
    <DropdownMenu
      label={title}
      closeLabel={title}
      trigger={({ isOpen, toggle, menuId }) => (
        <Button
          variant="secondary"
          onPress={toggle}
          accessibilityLabel={title}
          accessibilityState={{ expanded: isOpen }}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          aria-controls={isOpen ? menuId : undefined}
        >
          <Icon.Funnel size={18} color={colors.text.default} />
          <Text>{title}</Text>
        </Button>
      )}
    >
      {() => (
        <MenuContent>
          <Text.S weight={700}>{includeLabel}</Text.S>
          {options.length > 0 ? (
            <>
              <Separator />
              {[...serverGroups.values()].map((serverGroup, serverIndex) => (
                <Fragment key={serverGroup.id}>
                  {serverIndex > 0 ? <Separator /> : null}
                  <ServerLabel color={colors.text.secondary}>{serverGroup.label}</ServerLabel>
                  {serverGroup.options.map((option) => {
                    const included = includedKeySet.has(option.key);

                    return (
                      <DropdownOption
                        key={option.key}
                        role="menuitem"
                        accessibilityState={{ checked: included }}
                        $selected={included}
                        onPress={() => onToggleIncluded(option.key)}
                      >
                        {included ? <Icon.Check size={16} color={colors.text.brand} /> : <CheckSlot />}
                        <Text.S>{option.label}</Text.S>
                      </DropdownOption>
                    );
                  })}
                </Fragment>
              ))}
            </>
          ) : (
            <Text.S color={colors.text.secondary}>{emptyLabel}</Text.S>
          )}
        </MenuContent>
      )}
    </DropdownMenu>
  );
};
