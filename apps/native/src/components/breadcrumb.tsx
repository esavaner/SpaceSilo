import React from 'react';
import styled from 'styled-components/native';
import { ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Button, Text, theme, useThemeColors } from '@repo/shared/components';

const Trail = styled.ScrollView`
  flex-grow: 0;
`;

const Segment = styled.View`
  margin-right: ${theme.spacing[100]};
  flex-direction: row;
  align-items: center;
`;

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
const HOME_LABEL = 'common.labels.home';

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
  const { t } = useTranslation();
  const colors = useThemeColors();
  const breadcrumbItems =
    pathItems !== undefined
      ? createPathBreadcrumbItems({
          pathItems,
          handlePathClick,
          homeDirName,
        })
      : items;

  return (
    <Trail
      horizontal
      contentContainerStyle={{ alignItems: 'center' }}
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {breadcrumbItems.map((item, index) => (
        <React.Fragment key={item.key}>
          <Segment>
            {index !== 0 && <ChevronRight color={colors.text.secondary} size={14} />}
            {item.onPress ? (
              <Button variant="tertiary" size="small" onPress={item.onPress}>
                {item.label === HOME_LABEL ? t(HOME_LABEL) : item.label}
              </Button>
            ) : (
              <Text color={theme.colors.text.secondary}>{item.label}</Text>
            )}
          </Segment>
        </React.Fragment>
      ))}
    </Trail>
  );
};
