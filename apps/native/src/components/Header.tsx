import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import { Link } from 'expo-router';
import { DrawerHeaderProps } from '@react-navigation/drawer';
import { Icon } from './general/icon';
import { Text } from './general/text';
import { Button } from './general/button';
import { routeLabels } from '@/constants/routes';

type HeaderProps = DrawerHeaderProps;

export const Header = ({ navigation, route }: HeaderProps) => {
  const { width } = useWindowDimensions();

  return (
    <View className="p-2 flex flex-row gap-2 items-center bg-muted">
      {width <= 992 && (
        <Button variant="ghost" onPress={navigation.toggleDrawer} className="p-2">
          <Icon.Menu />
        </Button>
      )}
      <Text>{routeLabels[route.name as keyof typeof routeLabels]}</Text>
      <Button variant="ghost" className="ml-auto p-2">
        <Icon.Search />
      </Button>

      <Link href="/login" asChild>
        <Button variant="ghost" className="p-2">
          <Icon.Person />
        </Button>
      </Link>
    </View>
  );
};
