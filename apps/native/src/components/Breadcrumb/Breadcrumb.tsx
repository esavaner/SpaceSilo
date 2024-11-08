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
    <View className="flex flex-row items-center gap-3">
      {pathItems.map((item, index) => (
        <React.Fragment key={index}>
          {index !== 0 && <NavigateNextIcon />}
          <Pressable key={index} onPress={() => handleItemClick(index)}>
            <Text className="text-content-tertiary hover:text-content hover:underline">
              {index === 0 ? t('files.homeDir') : item}
            </Text>
          </Pressable>
        </React.Fragment>
      ))}
    </View>
  );
};
