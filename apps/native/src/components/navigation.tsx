import { router, usePathname } from 'expo-router';
import { ScrollView } from 'react-native';
import styled from 'styled-components/native';
import { Button, Icon, Text, theme, useThemeColors } from '@repo/shared/components';
import { routeIcons, routeLabels, routes } from '@/constants/routes';
import { useServerContext } from '@/providers/ServerProvider';
import { serverIcons } from '@/constants/server-icons';
import { useTranslation } from 'react-i18next';

const AppTitle = styled(Text)`
  align-self: center;
  margin: ${theme.spacing[600]} 0;
`;

const MenuItem = styled.Pressable<{ $active?: boolean }>`
  flex-direction: row;
  align-items: center;
  gap: ${theme.spacing[300]};
  margin: 0 ${theme.spacing[200]} ${theme.spacing[200]};
  padding: ${theme.spacing[200]};
  border-radius: ${theme.radius[150]};
  background-color: ${({ $active }) => ($active ? theme.colors.surface.medium : 'transparent')};

  &:hover {
    background-color: ${theme.colors.tertiary.hover};
  }
`;

const MenuLabel = styled(Text)`
  margin-bottom: ${theme.spacing[50]};
`;

const ConnectionsHeader = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin: ${theme.spacing[600]} ${theme.spacing[300]} ${theme.spacing[200]};
`;

const AddButton = styled(Button)`
  width: 40px;
  height: 40px;
  padding: 0;
`;

export const Navigation = ({ onClose }: { onClose?: () => void }) => {
  const { t } = useTranslation();
  const { allServers } = useServerContext();
  const colors = useThemeColors();
  const pathname = usePathname();

  return (
    <>
      <AppTitle>{t('navigation.app')}</AppTitle>
      {onClose && (
        <MenuItem onPress={onClose} accessibilityRole="button">
          <Icon.X color={colors.text.secondary} size={18} aria-hidden />
          <MenuLabel>{t('common.actions.close')}</MenuLabel>
        </MenuItem>
      )}
      <ScrollView>
        {Object.values(routes).map((key) => {
          const RouteIcon = routeIcons[key];
          const href = key === routes.index ? '/' : (`/${key}` as const);
          return (
            <MenuItem
              key={key}
              onPress={() => {
                router.navigate(href);
                onClose?.();
              }}
              $active={pathname === href}
              accessibilityRole="button"
              accessibilityState={{ selected: pathname === href }}
            >
              <RouteIcon color={colors.text.secondary} size={18} />
              <MenuLabel>{routeLabels[key]}</MenuLabel>
            </MenuItem>
          );
        })}
        <ConnectionsHeader>
          <Text.S>{t('navigation.connections')}</Text.S>
          <AddButton
            variant="tertiary"
            size="small"
            center
            accessibilityLabel={t('navigation.connections')}
            onPress={() => {
              router.push('/connections');
              onClose?.();
            }}
          >
            <Icon.Plus color={colors.text.default} size={18} />
          </AddButton>
        </ConnectionsHeader>
        {allServers.map((server) => (
          <MenuItem
            key={server.id}
            accessibilityRole="button"
            onPress={() => {
              router.push({ pathname: '/connections/[serverId]', params: { serverId: server.id } });
              onClose?.();
            }}
          >
            {serverIcons[server.type]}
            <MenuLabel>{server.label}</MenuLabel>
          </MenuItem>
        ))}
      </ScrollView>
    </>
  );
};
