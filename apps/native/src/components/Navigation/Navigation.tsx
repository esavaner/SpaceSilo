import { NavigationItem, NavigationItemProps } from './NavigationItem';
import { DrawerContentComponentProps, DrawerContentScrollView } from '@react-navigation/drawer';

type NavigationProps = DrawerContentComponentProps & {
  items: NavigationItemProps[];
};

export const Navigation = (props: NavigationProps) => {
  return (
    <DrawerContentScrollView {...props} className="bg-layer" style={{ backgroundColor: 'var(--color-background)' }}>
      {props.items.map((item) => (
        <NavigationItem key={item.path} onPress={(path) => props.navigation.navigate(path)} {...item} />
      ))}
    </DrawerContentScrollView>
  );
};
