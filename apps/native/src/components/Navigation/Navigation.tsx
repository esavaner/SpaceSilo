import { Pressable, View } from 'react-native';
import { DrawerContentComponentProps, DrawerContentScrollView } from '@react-navigation/drawer';
import { Text } from '../general/text';
import { routeIcons, routeLabels, routes } from '@/constants/routes';

type NavigationProps = DrawerContentComponentProps;

export const Navigation = (props: NavigationProps) => {
  return (
    <View className="flex-1 bg-background h-full">
      <DrawerContentScrollView
        {...props}
        className="bg-background"
        style={{ backgroundColor: 'var(--color-background)' }}
      >
        {Object.values(routes).map((key) => (
          <Pressable
            key={key}
            onPress={() => props.navigation.navigate(key)}
            className="px-2 py-2  mx-2 mb-2 rounded-md flex-1 flex-row items-center hover:bg-secondary"
          >
            {routeIcons[key]}
            <Text className="ml-2">{routeLabels[key]}</Text>
          </Pressable>
        ))}
      </DrawerContentScrollView>
    </View>
  );
};
