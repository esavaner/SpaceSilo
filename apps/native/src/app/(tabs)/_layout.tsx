import React from 'react';

import { Navigation } from '@/components/Navigation/Navigation';
import { NavigationItemProps } from '@/components/Navigation/NavigationItem';
import { useWindowDimensions, Platform } from 'react-native';
import { Drawer } from 'expo-router/drawer';
import { FileIcon, UserGroupIcon } from '@/components/icons';
import { Header } from '@/components/Header';

const items: NavigationItemProps[] = [
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
    label: 'Groups',
    path: 'groups',
    icon: <UserGroupIcon size={18} />,
  },
  {
    label: 'RNP Test',
    path: 'rnp',
    icon: <FileIcon size={20} />,
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
    </Drawer>
  );
}
