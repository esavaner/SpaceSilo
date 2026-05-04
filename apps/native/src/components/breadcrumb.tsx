import React from 'react';
import { ScrollView, View } from 'react-native';
import { Text } from './general/text';
import { Button } from './general/button';
import { Icon } from './general/icon';

export type BreadcrumbItem = {
  key: string;
  label: string;
  onPress?: () => void;
};

type PathBreadcrumbProps = {
  pathItems: string[];
  handlePathClick: (newPath: string) => void;
  homeDirName?: string;
  items?: never;
};

type Props =
  | PathBreadcrumbProps
  | {
      items: BreadcrumbItem[];
      pathItems?: never;
      handlePathClick?: never;
      homeDirName?: never;
    };

const ROOT_KEY = '__breadcrumb_root__';
const HOME_LABEL = 'Home';

const createPathBreadcrumbItems = ({
  pathItems,
  handlePathClick,
  homeDirName,
}: PathBreadcrumbProps): BreadcrumbItem[] => {
  const normalizedPathItems = pathItems.length > 0 ? pathItems : [''];

  return normalizedPathItems.map((item, index) => ({
    key: index === 0 ? ROOT_KEY : `${normalizedPathItems.slice(0, index + 1).join('/')}:${index}`,
    label: index === 0 ? homeDirName || item || HOME_LABEL : item,
    onPress: () => handlePathClick(normalizedPathItems.slice(0, index + 1).join('/')),
  }));
};

export const Breadcrumb = ({ pathItems, handlePathClick, homeDirName, items }: Props) => {
  const breadcrumbItems =
    pathItems !== undefined
      ? createPathBreadcrumbItems({
          pathItems,
          handlePathClick,
          homeDirName,
        })
      : items;

  return (
    <ScrollView horizontal className="items-center" showsHorizontalScrollIndicator={false}>
      {breadcrumbItems.map((item, index) => (
        <React.Fragment key={item.key}>
          <View className="mr-1 flex-row items-center">
            {index !== 0 && <Icon.NavigateNext className="mr-1 text-muted-foreground" size={14} />}
            {item.onPress ? (
              <Button variant="ghost" size="sm" onPress={item.onPress}>
                <Text>{item.label}</Text>
              </Button>
            ) : (
              <Text className="text-muted-foreground">{item.label}</Text>
            )}
          </View>
        </React.Fragment>
      ))}
    </ScrollView>
  );
};
