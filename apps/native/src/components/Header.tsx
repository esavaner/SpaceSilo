import React from 'react';
import { View, Pressable, useWindowDimensions } from 'react-native';
import { Link } from 'expo-router';
import { MenuIcon, PersonIcon, SearchIcon, Text } from '@repo/ui';
import { DrawerHeaderProps } from '@react-navigation/drawer';

type HeaderProps = DrawerHeaderProps & {
  title?: string;
};

export const Header = ({ title, navigation, ...rest }: HeaderProps) => {
  const { width } = useWindowDimensions();

  return (
    <View className="p-2 flex flex-row gap-4 items-center bg-layer-secondary">
      {width <= 992 && (
        <Pressable onPress={navigation.toggleDrawer}>
          <MenuIcon />
        </Pressable>
      )}
      <Text className="text-gray-50 text-lg">{title}</Text>
      <Pressable className="ml-auto">
        <SearchIcon />
      </Pressable>
      <Link href="/login" className="h-8 w-8 flex items-center justify-center rounded-full border border-content">
        <PersonIcon />
      </Link>
    </View>
  );
};
