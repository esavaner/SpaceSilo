import React from 'react';

import { Navigation } from '@/components/Navigation/Navigation';
import { NavigationItemProps } from '@/components/Navigation/NavigationItem';
import { useWindowDimensions, Platform } from 'react-native';
import { Drawer } from 'expo-router/drawer';
import { FileIcon } from '@repo/ui';
import { Header } from '@/components/Header';

const items: NavigationItemProps[] = [
  {
    label: 'Welcome',
    path: 'welcome',
    icon: <FileIcon size={20} />,
  },
  {
    label: 'Files',
    path: 'files/index',
    icon: <FileIcon size={20} />,
    subitems: [
      ...(Platform.OS === 'web'
        ? []
        : [
            {
              label: 'On device',
              path: 'files/local',
            },
          ]),
      {
        label: 'Remote',
        path: 'files/remote',
      },
      {
        label: 'Sync',
        path: 'files/sync',
      },
    ],
  },
  {
    label: 'Files2',
    path: 'files2',
    icon: <FileIcon size={20} />,
    subitems: [
      {
        label: 'On device',
        path: 'files/local',
      },
      {
        label: 'Remote',
        path: 'files/remote',
      },
      {
        label: 'Sync',
        path: 'files/sync',
      },
    ],
  },
];

export default function TabLayout() {
  const { width } = useWindowDimensions();

  return (
    <Drawer
      screenOptions={{
        drawerType: width > 992 ? 'permanent' : 'slide',
        drawerStyle: { backgroundColor: 'transparent' },
        header: (props) => <Header {...props} />,
      }}
      drawerContent={(props) => <Navigation {...props} items={items} />}
      initialRouteName="files/index"
    >
      <Drawer.Screen name="files/index" />
      <Drawer.Screen name="files/local" />
      <Drawer.Screen name="welcome" />
    </Drawer>
  );
}
