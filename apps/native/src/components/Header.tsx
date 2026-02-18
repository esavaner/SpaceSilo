import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import { Link } from 'expo-router';
import { DrawerHeaderProps } from '@react-navigation/drawer';
import { MenuIcon, SearchIcon, PersonIcon } from './icons';
import { Text } from './general/text';
import { Button } from './general/button';
import { routeLabels } from '@/constants/routes';

type HeaderProps = DrawerHeaderProps & {
  title?: string;
};

export const Header = ({ title, navigation, route, ...rest }: HeaderProps) => {
  console.log(rest);
  const { width } = useWindowDimensions();

  return (
    <View className="p-2 flex flex-row gap-2 items-center bg-muted">
      <Text>{routeLabels[route.name as keyof typeof routeLabels]}</Text>
      {width <= 992 && (
        <Button variant="ghost" onPress={navigation.toggleDrawer} className="p-2">
          <MenuIcon />
        </Button>
      )}
      <Text>{title}</Text>
      <Button variant="ghost" className="ml-auto p-2">
        <SearchIcon />
      </Button>

      <Link href="/login" asChild>
        <Button variant="ghost" className="p-2">
          <PersonIcon />
        </Button>
      </Link>
    </View>
  );
};
