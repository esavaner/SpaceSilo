import { Pressable, View } from 'react-native';
import { DrawerContentComponentProps, DrawerContentScrollView } from '@react-navigation/drawer';
import { Text } from '../general/text';
import { routeIcons, routeLabels, routes } from '@/constants/routes';
import { Icon } from '../general/icon';
import { cn } from '@/utils/cn';

type NavigationProps = DrawerContentComponentProps;

export const Navigation = (props: NavigationProps) => {
  console.log('Navigation props:', props);
  const currentRoute = props.state.routeNames[props.state.index];
  return (
    <>
      <Text className="self-center my-6">App</Text>
      <DrawerContentScrollView {...props}>
        {Object.values(routes).map((key) => (
          <Pressable
            key={key}
            onPress={() => props.navigation.navigate(key)}
            className={cn(
              'px-2 py-2 mb-2 mx-2 rounded-md flex-1 flex-row items-center hover:bg-secondary',
              currentRoute === key && 'bg-muted'
            )}
          >
            {routeIcons[key]}
            <Text className="ml-3 mb-0.5">{routeLabels[key]}</Text>
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
