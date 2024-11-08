import { cn, Text } from '@repo/ui';
import { Pressable, View } from 'react-native';
import { useState } from 'react';
import { ChevronRightIcon } from '@/assets/icons';

type Item = {
  label: string;
  path: string;
};

export type NavigationItemProps = Item & {
  onPress?: (path: string) => void;
  icon: React.ReactNode;
  subitems?: Item[];
};

const itemStyles =
  'py-1 pl-3 pr-2 mb-1 rounded flex-1 flex-row items-center hover:bg-layer-secondary active:bg-layer-secondary focus:bg-layer-secondary';

export const NavigationItem = ({ label, path, onPress, icon, subitems }: NavigationItemProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const hasSubitems = subitems && subitems.length > 0;

  return (
    <>
      <Pressable onPress={() => onPress?.(path)} className={cn(itemStyles)}>
        {icon}
        <Text className="ml-2">{label}</Text>
        {hasSubitems && (
          <Pressable
            onPress={() => setIsOpen(!isOpen)}
            className={cn('transition-all transform ml-auto', isOpen && 'rotate-90')}
          >
            <ChevronRightIcon />
          </Pressable>
        )}
      </Pressable>
      {isOpen && hasSubitems && (
        <View className="ml-5 pl-2 mb-1 border-l border-content">
          {subitems?.map((subitem) => (
            <Pressable key={subitem.path} onPress={() => onPress?.(subitem.path)} className={cn(itemStyles)}>
              <Text>{subitem.label}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </>
  );
};
