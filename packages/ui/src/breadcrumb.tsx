import { Pressable, ScrollView, View } from 'react-native';
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
    <ScrollView horizontal className="h-8">
      {pathItems.map((item, index) => (
        <Pressable key={index} className="flex flex-row items-center gap-2 mr-2" onPress={() => handleItemClick(index)}>
          {index !== 0 && <NavigateNextIcon />}
          <Text className="text-content-tertiary hover:text-content hover:underline">
            {index === 0 ? homeDirName : item}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
};

// export const Breadcrumb = ({ pathItems, handlePathClick, homeDirName }: BreadcrumbProps) => {
//   const handleItemClick = (index: number) => {
//     const newPath = pathItems.slice(0, index + 1).join('/');
//     handlePathClick(newPath);
//   };

//   return (
//     <ScrollView horizontal className="h-8">
//       <BreadcrumbItem key={''} item={homeDirName || 'Home'} homeDir onPress={() => handlePathClick('')} />
//       {pathItems.map((item, index) => (
//         <BreadcrumbItem key={item + index} item={item} onPress={() => handleItemClick(index)} />
//       ))}
//     </ScrollView>
//   );
// };

// type BreadcrumbItemProps = {
//   item: string;
//   onPress: () => void;
//   homeDir?: boolean;
// };

// const BreadcrumbItem = ({ item, homeDir, onPress }: BreadcrumbItemProps) => {
//   return (
//     <Pressable className="flex flex-row items-center gap-2 mr-2" onPress={onPress}>
//       {!homeDir && <NavigateNextIcon />}
//       <Text className="text-content-tertiary hover:text-content hover:underline">{item}</Text>
//     </Pressable>
//   );
// };
