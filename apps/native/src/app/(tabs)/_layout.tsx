import { useCallback, useState } from 'react';
import { Navigation } from '@/components/navigation';
import { useWindowDimensions } from 'react-native';
import { Tabs } from 'expo-router';
import { Button, Icon, SideDrawer, theme, useThemeColors } from '@repo/shared/components';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components/native';

const Toolbar = styled.View`
  align-items: flex-start;
  padding: ${theme.spacing[200]} ${theme.spacing[400]};
  background-color: ${theme.colors.surface.default};
  border-bottom-width: ${theme.borderWeight[25]};
  border-bottom-color: ${theme.colors.border.default};
`;

export default function TabLayout() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { width } = useWindowDimensions();
  const wide = width > theme.breakpointNumbers.md;
  const [wideOpen, setWideOpen] = useState(true);
  const [narrowOpen, setNarrowOpen] = useState(false);
  const open = wide ? wideOpen : narrowOpen;
  const setOpen = wide ? setWideOpen : setNarrowOpen;

  const closeNarrowDrawer = useCallback(() => setNarrowOpen(false), []);

  return (
    <SideDrawer
      open={open}
      mode={wide ? 'push' : 'overlay'}
      onClose={closeNarrowDrawer}
      panel={<Navigation onClose={wide ? undefined : closeNarrowDrawer} />}
    >
      <Toolbar>
        <Button
          variant="tertiary"
          size="small"
          accessibilityLabel={t('navigation.toggle')}
          accessibilityState={{ expanded: open }}
          onPress={() => setOpen(!open)}
        >
          <Icon.Menu color={colors.text.default} aria-hidden />
        </Button>
      </Toolbar>
      <Tabs backBehavior="firstRoute" screenOptions={{ headerShown: false }} tabBar={() => null} />
    </SideDrawer>
  );
}
