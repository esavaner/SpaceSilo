import { useCallback, useState } from 'react';
import { Navigation, NavigationToggleContext } from '@/components/navigation';
import { useWindowDimensions } from 'react-native';
import { Tabs } from 'expo-router';
import { SideDrawer, theme } from '@repo/shared/components';

export default function TabLayout() {
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
      <NavigationToggleContext.Provider value={{ open, toggle: () => setOpen(!open) }}>
        <Tabs backBehavior="firstRoute" screenOptions={{ headerShown: false }} tabBar={() => null} />
      </NavigationToggleContext.Provider>
    </SideDrawer>
  );
}
