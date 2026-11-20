import React, { useEffect, useState } from 'react';
import { TextInput } from 'react-native';
import styled from 'styled-components/native';
import { Input, theme } from '@repo/shared/components';
import { useTranslation } from 'react-i18next';

const SearchContainer = styled.View<{ $open: boolean }>`
  position: relative;
  z-index: ${({ $open }) => ($open ? theme.zIndex.dropdown : theme.zIndex.base)};
`;

const Results = styled.ScrollView`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: ${theme.spacing[100]};
  min-width: 96px;
  max-height: 320px;
  border-radius: ${theme.radius[200]};
  background-color: ${theme.colors.surface.weak};
  border-width: ${theme.borderWeight[25]};
  border-color: ${theme.colors.border.default};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
`;

type Props = React.ComponentProps<typeof TextInput> & {
  options: React.ReactNode[];
};

export const Search = ({ options, ...rest }: Props) => {
  const { t } = useTranslation();
  const [isDropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    setDropdownOpen(options.length > 0);
  }, [options]);

  return (
    <SearchContainer $open={isDropdownOpen}>
      <Input {...rest} hideLabel label={rest.placeholder || t('common.labels.search')} />
      {isDropdownOpen && <Results keyboardShouldPersistTaps="handled">{options}</Results>}
    </SearchContainer>
  );
};
