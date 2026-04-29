import { Pressable, View } from 'react-native';
import { DrawerContentComponentProps, DrawerContentScrollView } from '@react-navigation/drawer';
import { router } from 'expo-router';
import { Text } from './general/text';
import { routeIcons, routeLabels, routes } from '@/constants/routes';
import { Icon } from './general/icon';
import { cn } from '@/utils/cn';
import { Button } from './general/button';
import { useServerContext } from '@/providers/ServerProvider';
import { serverIcons } from '@/constants/server-icons';

type NavigationProps = DrawerContentComponentProps;

export const Navigation = (props: NavigationProps) => {
  const { servers } = useServerContext();

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
              'px-2 py-2 mb-2 mx-2 gap-3 rounded-md flex-1 flex-row items-center hover:bg-secondary',
              currentRoute === key && 'bg-muted'
            )}
          >
            {routeIcons[key]}
            <Text className="mb-0.5">{routeLabels[key]}</Text>
          </Pressable>
        ))}
        <View className="flex-row justify-between items-center mt-6 mx-3 mb-2">
          <Text variant="small">Connections</Text>
          <Button variant="ghost" onPress={() => router.push('/connections')}>
            <Icon.Add />
          </Button>
        </View>
        {servers.map((server) => (
          <Pressable
            key={server.id}
            onPress={() => router.push({ pathname: '/connections/[serverId]', params: { serverId: server.id } })}
            className="px-2 py-2 mb-2 mx-2 gap-3 rounded-md flex-1 flex-row items-center hover:bg-secondary"
          >
            {serverIcons[server.type]}
            <Text className="mb-0.5">{server.label}</Text>
          </Pressable>
        ))}
      </DrawerContentScrollView>
    </>
  );
};
