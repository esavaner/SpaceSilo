import { ScrollView } from 'react-native';
import React from 'react';
import { Text } from './general/text';
import { Button } from './general/button';
import { Icon } from './general/icon';

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
    <ScrollView horizontal className="items-center">
      {pathItems.map((item, index) => (
        <React.Fragment key={index}>
          {index !== 0 && <Icon.NavigateNext className="mt-3 mr-1" />}
          <Button variant="ghost" className="mr-1" onPress={() => handleItemClick(index)}>
            <Text>{index === 0 ? homeDirName : item}</Text>
          </Button>
        </React.Fragment>
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
//       <Text className="text-muted-foreground hover:text-foreground hover:underline">{item}</Text>
//     </Pressable>
//   );
// };
