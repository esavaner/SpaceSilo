import { Breadcrumb, type BreadcrumbItem } from '@/components/breadcrumb';
import { IncludedGroupsDropdown, type IncludedGroupOption } from '@/components/dropdowns/IncludedGroups.dropdown';
import { Search } from '@/components/search';
import { Button, Dropdown, Icon, Text, theme, useThemeColors } from '@repo/shared/components';
import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useWindowDimensions } from 'react-native';
import styled from 'styled-components/native';

const HeaderRow = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${theme.spacing[300]};
`;

const TitleSection = styled.View`
  gap: ${theme.spacing[200]};
  max-width: 100%;
`;

const SearchField = styled.View<{ $wide: boolean }>`
  width: ${({ $wide }) => ($wide ? '320px' : '100%')};
  max-width: 100%;
`;

const Actions = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: ${theme.spacing[200]};
  max-width: 100%;
`;

const SelectionPanel = styled.View`
  gap: ${theme.spacing[200]};
  padding: ${theme.spacing[300]};
  border-radius: ${theme.radius[200]};
  border-width: ${theme.borderWeight[25]};
  border-color: ${theme.colors.border.default};
  background-color: ${theme.colors.surface.default};
`;

type LabelledOption<T extends string> = {
  label: string;
  value: T;
};

type GroupFilter = {
  options: IncludedGroupOption[];
  includedKeys: string[];
  title: string;
  includeLabel: string;
  emptyLabel: string;
  onToggleIncluded: (key: string) => void;
};

type GalleryBrowserHeaderProps<GroupBy extends string, ViewMode extends string, PendingAction extends string> = {
  isTrashMode: boolean;
  title: string;
  breadcrumbItems: BreadcrumbItem[];
  albumSearch?: {
    value: string;
    options: ReactNode[];
    onChangeText: (value: string) => void;
    placeholder: string;
  };
  viewModeOptions: LabelledOption<ViewMode>[];
  viewMode: ViewMode;
  onViewModeChange: (value: ViewMode) => void;
  groupByOptions: LabelledOption<GroupBy>[];
  groupBy: GroupBy;
  onGroupByChange: (value: GroupBy) => void;
  groupFilter: GroupFilter;
  isSelectionMode: boolean;
  selectedPhotoCountLabel: string;
  hasSelectedServer: boolean;
  pendingAction: PendingAction | null;
  serverCount: number;
  isUploading: boolean;
  onCreateAlbum: () => void;
  onUpload: () => void;
  onClearSelection: () => void;
  onAddToAlbum: () => void;
  onTrashSelected: () => void;
  onRestoreSelected: () => void;
  onDeleteSelectedPermanently: () => void;
  onRestoreAll: () => void;
  onDeleteAll: () => void;
};

function OptionMenu<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: LabelledOption<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  const colors = useThemeColors();

  return (
    <Dropdown
      label={label}
      trigger={(props) => (
        <Button {...props} variant="secondary">
          {options.find((option) => option.value === value)?.label}
          <Icon.ChevronDown size={18} color={colors.text.default} aria-hidden />
        </Button>
      )}
      items={options.map((option) => ({
        label: option.label,
        icon: option.value === value ? <Icon.Check size={18} color={colors.text.default} aria-hidden /> : undefined,
        onClick: () => onChange(option.value),
      }))}
    />
  );
}

export function GalleryBrowserHeader<GroupBy extends string, ViewMode extends string, PendingAction extends string>({
  isTrashMode,
  title,
  breadcrumbItems,
  albumSearch,
  viewModeOptions,
  viewMode,
  onViewModeChange,
  groupByOptions,
  groupBy,
  onGroupByChange,
  groupFilter,
  isSelectionMode,
  selectedPhotoCountLabel,
  hasSelectedServer,
  pendingAction,
  serverCount,
  isUploading,
  onCreateAlbum,
  onUpload,
  onClearSelection,
  onAddToAlbum,
  onTrashSelected,
  onRestoreSelected,
  onDeleteSelectedPermanently,
  onRestoreAll,
  onDeleteAll,
}: GalleryBrowserHeaderProps<GroupBy, ViewMode, PendingAction>) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { width } = useWindowDimensions();
  const noServers = serverCount === 0;

  return (
    <>
      <HeaderRow>
        <TitleSection>
          <Text.H1>{title}</Text.H1>
          {albumSearch ? (
            <SearchField $wide={width >= theme.breakpointNumbers.sm}>
              <Search
                options={albumSearch.options}
                value={albumSearch.value}
                onChangeText={albumSearch.onChangeText}
                placeholder={albumSearch.placeholder}
              />
            </SearchField>
          ) : null}
          {!isTrashMode && breadcrumbItems.length > 0 ? <Breadcrumb items={breadcrumbItems} /> : null}
        </TitleSection>

        <Actions>
          <IncludedGroupsDropdown {...groupFilter} />

          {isTrashMode ? (
            <>
              <Button
                variant="secondary"
                onPress={onRestoreAll}
                disabled={noServers}
                loading={pendingAction === 'restore-all'}
              >
                <Icon.Check size={18} color={noServers ? colors.text.disabled : colors.text.default} aria-hidden />
                {t('gallery.actions.restoreAll')}
              </Button>
              <Button
                variant="destructive"
                onPress={onDeleteAll}
                disabled={noServers}
                loading={pendingAction === 'delete-all'}
                style={{ maxWidth: '100%' }}
              >
                <Icon.Trash size={18} color={noServers ? colors.text.disabled : colors.text.inverted} aria-hidden />
                <Text.S color={noServers ? colors.text.disabled : colors.text.inverted} style={{ flexShrink: 1 }}>
                  {t('gallery.actions.deleteAll')}
                </Text.S>
              </Button>
            </>
          ) : (
            <>
              <OptionMenu
                label={t('gallery.viewModes.label')}
                options={viewModeOptions}
                value={viewMode}
                onChange={onViewModeChange}
              />

              <OptionMenu
                label={t('gallery.groupBy.label')}
                options={groupByOptions}
                value={groupBy}
                onChange={onGroupByChange}
              />

              <Button variant="secondary" onPress={onCreateAlbum} disabled={noServers}>
                <Icon.Folder size={18} color={noServers ? colors.text.disabled : colors.text.default} aria-hidden />
                {breadcrumbItems.length > 0 ? t('gallery.actions.newSubalbum') : t('gallery.actions.newAlbum')}
              </Button>

              <Button onPress={onUpload} loading={isUploading}>
                <Icon.Plus size={18} color={colors.text.inverted} aria-hidden />
                {t('gallery.actions.upload')}
              </Button>
            </>
          )}
        </Actions>
      </HeaderRow>

      {isSelectionMode ? (
        <SelectionPanel>
          <Actions>
            <Button
              variant="tertiary"
              size="small"
              onPress={onClearSelection}
              accessibilityLabel={t('gallery.actions.clearSelection')}
            >
              <Icon.X size={18} color={colors.text.default} aria-hidden />
            </Button>
            <Text style={{ marginRight: 'auto' }}>{selectedPhotoCountLabel}</Text>

            {isTrashMode ? (
              <>
                <Button variant="secondary" onPress={onRestoreSelected} loading={pendingAction === 'restore'}>
                  <Icon.Check size={18} color={colors.text.default} aria-hidden />
                  {t('gallery.actions.restoreSelected')}
                </Button>
                <Button
                  variant="destructive"
                  onPress={onDeleteSelectedPermanently}
                  loading={pendingAction === 'delete-permanently'}
                >
                  <Icon.Trash size={18} color={colors.text.inverted} aria-hidden />
                  {t('gallery.actions.deletePermanently')}
                </Button>
              </>
            ) : (
              <>
                <Button variant="secondary" onPress={onCreateAlbum} disabled={!hasSelectedServer}>
                  <Icon.Folder
                    size={18}
                    color={hasSelectedServer ? colors.text.default : colors.text.disabled}
                    aria-hidden
                  />
                  {t('gallery.actions.newAlbum')}
                </Button>
                <Button variant="secondary" onPress={onAddToAlbum} disabled={!hasSelectedServer}>
                  <Icon.Folder
                    size={18}
                    color={hasSelectedServer ? colors.text.default : colors.text.disabled}
                    aria-hidden
                  />
                  {t('gallery.actions.addToAlbum')}
                </Button>
                <Button variant="secondary" onPress={onTrashSelected} loading={pendingAction === 'trash'}>
                  <Icon.Trash size={18} color={colors.text.default} aria-hidden />
                  {t('gallery.actions.trash')}
                </Button>
              </>
            )}
          </Actions>

          {!isTrashMode && !hasSelectedServer ? (
            <Text.S color={theme.colors.text.secondary}>{t('gallery.singleServerRequired')}</Text.S>
          ) : null}
        </SelectionPanel>
      ) : null}
    </>
  );
}
