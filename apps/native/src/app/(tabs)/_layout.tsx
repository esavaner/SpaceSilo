import React from 'react';

import { Navigation } from '@/components/navigation';
import { useWindowDimensions } from 'react-native';
import { Drawer } from 'expo-router/drawer';

export default function TabLayout() {
  const { width } = useWindowDimensions();

  return (
    <Drawer
      screenOptions={{
        drawerType: width > 992 ? 'permanent' : 'slide',
        drawerStyle: { backgroundColor: 'transparent', width: 260 },
        header: () => <></>,
      }}
      drawerContent={(props) => <Navigation {...props} />}
    />
  );
}
