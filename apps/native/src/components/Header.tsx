import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import { Link } from 'expo-router';
import { Button, MenuIcon, PersonIcon, SearchIcon, Text } from '@repo/ui';
import { DrawerHeaderProps } from '@react-navigation/drawer';

type HeaderProps = DrawerHeaderProps & {
  title?: string;
};

export const Header = ({ title, navigation, ...rest }: HeaderProps) => {
  const { width } = useWindowDimensions();

  return (
    <View className="p-2 flex flex-row gap-2 items-center bg-layer-secondary">
      {width <= 992 && (
        <Button variant="icon" onPress={navigation.toggleDrawer}>
          <MenuIcon />
        </Button>
      )}
      <Text className="text-gray-50 text-lg">{title}</Text>
      <Button variant="icon" className="ml-auto">
        <SearchIcon />
      </Button>

      <Link href="/login" asChild>
        <Button variant="icon">
          <PersonIcon />
        </Button>
      </Link>
    </View>
  );
};
