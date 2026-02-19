import { Pressable, View } from 'react-native';
import { DrawerContentComponentProps, DrawerContentScrollView } from '@react-navigation/drawer';
import { Text } from '../general/text';
import { routeIcons, routeLabels, routes } from '@/constants/routes';
import { Icon } from '../general/icon';

type NavigationProps = DrawerContentComponentProps;

export const Navigation = (props: NavigationProps) => {
  return (
    <>
      <Text className="self-center my-6">App</Text>
      <DrawerContentScrollView {...props}>
        {Object.values(routes).map((key) => (
          <Pressable
            key={key}
            onPress={() => props.navigation.navigate(key)}
            className="px-2 py-2 mb-2 mx-2 rounded-md flex-1 flex-row items-center hover:bg-secondary"
          >
            {routeIcons[key]}
            <Text className="ml-2">{routeLabels[key]}</Text>
          </Pressable>
        ))}
        <View className="flex-row justify-between">
          <Text>Connections</Text>
          <Icon.Add />
        </View>
      </DrawerContentScrollView>
    </>
  );
};
