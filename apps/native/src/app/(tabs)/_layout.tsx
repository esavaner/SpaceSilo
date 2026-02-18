import React from 'react';

import { Navigation } from '@/components/Navigation/Navigation';
import { useWindowDimensions } from 'react-native';
import { Drawer } from 'expo-router/drawer';

import { Header } from '@/components/Header';

export default function TabLayout() {
  const { width } = useWindowDimensions();

  return (
    <Drawer
      screenOptions={{
        drawerType: width > 992 ? 'permanent' : 'slide',
        drawerStyle: { backgroundColor: 'transparent' },
        header: (props) => <Header {...props} />,
      }}
      drawerContent={(props) => <Navigation {...props} />}
    />
  );
}
