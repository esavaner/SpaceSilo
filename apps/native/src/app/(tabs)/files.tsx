import { Breadcrumb } from '@/components/breadcrumb';
import { FileList } from '@/components/FileList';
import { useFilesContext } from '@/providers/FilesProvider';
import { useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useWindowDimensions } from 'react-native';
import styled from 'styled-components/native';
import { Copy, FileText, Folder, Trash2, X } from 'lucide-react-native';
import { BaseLayout } from '@/components/base-layout';
import { FileMoveCopyModal } from '@/components/modals/FileMoveCopy.modal';
import { FileRemoveModal } from '@/components/modals/FileRemove.modal';
import { Search } from '@/components/search';
import { useFileSearch, type FileSearchItem } from '@/hooks/useFileSearch';
import { Button, Text, theme, useModal, useThemeColors } from '@repo/shared/components';

const Header = styled.View`
  gap: ${theme.spacing[400]};
`;

const HeadingRow = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: ${theme.spacing[400]};
  z-index: ${theme.zIndex.raised};
`;

const SearchField = styled.View<{ $wide: boolean }>`
  width: ${({ $wide }) => ($wide ? '320px' : '100%')};
`;

const SearchResult = styled.Pressable`
  flex-direction: row;
  align-items: center;
  gap: ${theme.spacing[200]};
  padding: ${theme.spacing[200]} ${theme.spacing[300]};
  cursor: pointer;
  &:hover,
  &:active {
    background-color: ${theme.colors.surface.medium};
  }
`;

const SearchResultDetails = styled.View`
  flex: 1;
  gap: ${theme.spacing[50]};
`;

const SelectionBar = styled.View<{ $active: boolean }>`
  flex-direction: row;
  min-height: ${theme.spacing[1200]};
  align-items: center;
  background-color: ${({ $active }) => ($active ? theme.colors.surface.medium : theme.colors.surface.default)};
`;

const SelectionActions = styled.View`
  flex-direction: row;
  width: 100%;
  align-items: center;
  gap: ${theme.spacing[200]};
`;

const SelectionCount = styled(Text)`
  flex: 1;
`;

export default function FilesPage() {
  const { t } = useTranslation();
  const { path } = useLocalSearchParams<{ path?: string }>();
  const { openModal } = useModal();
  const colors = useThemeColors();
  const { width } = useWindowDimensions();
  const { clearSearch, query, results, searchFiles } = useFileSearch();

  const { currentPath, handlePathClick, handleClearSelection, hasSelectedItems, selectedItems, setInitialPath } =
    useFilesContext();

  useEffect(() => {
    if (path) {
      setInitialPath(path);
    }
  }, []);

  const handleSearchSelect = (file: FileSearchItem) => {
    const parentPath = file.uri.slice(0, file.uri.lastIndexOf('/'));
    handlePathClick(file.isDirectory ? file.uri : parentPath);
    clearSearch();
  };

  const searchOptions = results.map((file) => (
    <SearchResult key={`${file.serverId}:${file.groupId}:${file.uri}`} onPress={() => handleSearchSelect(file)}>
      {file.isDirectory ? (
        <Folder color={colors.text.brand} size={18} />
      ) : (
        <FileText color={colors.text.default} size={18} />
      )}
      <SearchResultDetails>
        <Text numberOfLines={1}>{file.name}</Text>
        <Text.S color={theme.colors.text.secondary} numberOfLines={1}>
          {file.uri}
        </Text.S>
      </SearchResultDetails>
    </SearchResult>
  ));

  const header = (
    <Header>
      <HeadingRow>
        <Text.H1>{t('navigation.files')}</Text.H1>
        <SearchField $wide={width >= theme.breakpointNumbers.md}>
          <Search
            options={searchOptions}
            value={query}
            onChangeText={searchFiles}
            placeholder={t('files.searchPlaceholder')}
          />
        </SearchField>
      </HeadingRow>
      <SelectionBar $active={hasSelectedItems}>
        {hasSelectedItems ? (
          <SelectionActions>
            <Button
              variant="tertiary"
              size="small"
              onPress={handleClearSelection}
              accessibilityLabel={t('files.clearSelection')}
            >
              <X size={18} color={colors.text.brand} />
            </Button>
            <SelectionCount>
              {selectedItems.length} {t('common.nouns.items')}
            </SelectionCount>
            <Button
              onPress={() => openModal(<FileMoveCopyModal path={currentPath} selectedItems={selectedItems} />)}
              variant="tertiary"
              size="small"
              accessibilityLabel={t('files.moveCopy.title')}
            >
              <Copy size={18} color={colors.text.brand} />
            </Button>
            <Button
              onPress={() => openModal(<FileRemoveModal files={selectedItems} />)}
              variant="tertiary"
              size="small"
              accessibilityLabel={t('common.actions.remove')}
            >
              <Trash2 size={18} color={colors.text.danger} />
            </Button>
          </SelectionActions>
        ) : (
          <Breadcrumb
            pathItems={currentPath.split(/\/|\\/)}
            handlePathClick={handlePathClick}
            homeDirName={t('files.homeDir')}
          />
        )}
      </SelectionBar>
    </Header>
  );

  return (
    <BaseLayout header={header} scrollable={false}>
      <FileList />
    </BaseLayout>
  );
}
