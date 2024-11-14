import { Pressable, View } from 'react-native';
import { Text } from '@repo/ui';
import { useTranslation } from 'react-i18next';
import React from 'react';
import { NavigateNextIcon } from '@/assets/icons';

type BreadcrumbProps = {
  pathItems: string[];
  handlePathClick: (newPath: string) => void;
};

export const Breadcrumb = ({ pathItems, handlePathClick }: BreadcrumbProps) => {
  const { t } = useTranslation();

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
            {index === 0 ? t('files.homeDir') : item}
          </Text>
        </Pressable>
      ))}
    </View>
  );
};
