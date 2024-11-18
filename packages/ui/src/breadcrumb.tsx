import { Pressable, View } from 'react-native';
import React from 'react';
import { NavigateNextIcon } from './icons';
import { Text } from './text';

type BreadcrumbProps = {
  pathItems: string[];
  handlePathClick: (newPath: string) => void;
  homeDirName?: string;
};

export const Breadcrumb = ({ pathItems, handlePathClick, homeDirName }: BreadcrumbProps) => {
  const handleItemClick = (index: number) => {
    const newPath = pathItems.slice(0, index + 1).join('/');
    handlePathClick(newPath);
  };

  return (
    <View className="flex flex-row items-center gap-2 h-8">
      {pathItems.map((item, index) => (
        <Pressable key={index} className="flex flex-row items-center gap-2" onPress={() => handleItemClick(index)}>
          {index !== 0 && <NavigateNextIcon />}
          <Text className="text-content-tertiary hover:text-content hover:underline">
            {index === 0 ? homeDirName : item}
          </Text>
        </Pressable>
      ))}
    </View>
  );
};
