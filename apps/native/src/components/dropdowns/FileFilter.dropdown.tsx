import { useFilesContext } from '@/providers/FilesProvider';
import { useServerContext } from '@/providers/ServerProvider';
import { Button, Checkbox, DropdownMenu, OverflowFade, Text, theme, useThemeColors } from '@repo/shared/components';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components/native';
import { Filter } from 'lucide-react-native';

const FilterContent = styled.View`
  gap: ${theme.spacing[300]};
  min-width: 200px;
`;

const ServerGroup = styled.View`
  gap: ${theme.spacing[300]};
`;

export const FileFilterDropdown = () => {
  const { t } = useTranslation();
  const { servers } = useServerContext();
  const { groups, handleToggleIncludedGroup, isGroupIncluded } = useFilesContext();
  const colors = useThemeColors();
  const serverIds = [...new Set(groups.map((group) => group.serverId))];

  return (
    <DropdownMenu
      label={t('files.filter.title')}
      closeLabel={t('common.actions.close')}
      trigger={({ isOpen, toggle, menuId }) => (
        <Button
          variant="tertiary"
          size="small"
          onPress={toggle}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          aria-controls={isOpen ? menuId : undefined}
        >
          <Filter size={18} color={colors.text.brand} />
          {t('files.filter.title')}
        </Button>
      )}
    >
      {({ isMobile, menuId }) => {
        const content = (
          <FilterContent nativeID={menuId}>
            <Text.Label>{t('files.filter.included')}</Text.Label>
            {serverIds.length === 0 && <Text.S color={theme.colors.text.secondary}>{t('files.filter.empty')}</Text.S>}
            {serverIds.map((serverId) => (
              <ServerGroup key={serverId}>
                <Text.S color={theme.colors.text.secondary}>
                  {servers.find((server) => server.id === serverId)?.label ?? t('common.messages.connectedServer')}
                </Text.S>
                {groups
                  .filter((group) => group.serverId === serverId)
                  .map((group) => (
                    <Checkbox
                      key={`${group.serverId}:${group.id}`}
                      label={group.name}
                      checked={isGroupIncluded(group)}
                      onValueChange={() => handleToggleIncludedGroup(group)}
                    />
                  ))}
              </ServerGroup>
            ))}
          </FilterContent>
        );
        return isMobile ? content : <OverflowFade maxHeight={300}>{content}</OverflowFade>;
      }}
    </DropdownMenu>
  );
};
