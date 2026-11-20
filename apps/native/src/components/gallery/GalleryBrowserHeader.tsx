import { Breadcrumb, type BreadcrumbItem } from '@/components/breadcrumb';
import { IncludedGroupsDropdown, type IncludedGroupOption } from '@/components/dropdowns/IncludedGroups.dropdown';
import { Search } from '@/components/search';
import { Button, Dropdown, Text, theme, useThemeColors } from '@repo/shared/components';
import { Check, ChevronDown, Folder, Plus, Trash2, X } from 'lucide-react-native';
import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

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
          <ChevronDown size={18} color={colors.text.default} aria-hidden />
        </Button>
      )}
      items={options.map((option) => ({
        label: option.label,
        icon: option.value === value ? <Check size={18} color={colors.text.default} aria-hidden /> : undefined,
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
  const noServers = serverCount === 0;

  return (
    <View className="gap-4">
      <View className="flex-row flex-wrap items-start justify-between gap-3">
        <View className="gap-2">
          <Text.H1>{title}</Text.H1>
          {albumSearch ? (
            <Search
              className="w-full md:w-80"
              options={albumSearch.options}
              value={albumSearch.value}
              onChangeText={albumSearch.onChangeText}
              placeholder={albumSearch.placeholder}
            />
          ) : null}
          {!isTrashMode && breadcrumbItems.length > 0 ? <Breadcrumb items={breadcrumbItems} /> : null}
        </View>

        <View className="flex-row flex-wrap items-center gap-2">
          <IncludedGroupsDropdown {...groupFilter} />

          {isTrashMode ? (
            <>
              <Button
                variant="secondary"
                onPress={onRestoreAll}
                disabled={noServers}
                loading={pendingAction === 'restore-all'}
              >
                <Check size={18} color={noServers ? colors.text.disabled : colors.text.default} aria-hidden />
                {t('gallery.actions.restoreAll')}
              </Button>
              <Button
                variant="destructive"
                onPress={onDeleteAll}
                disabled={noServers}
                loading={pendingAction === 'delete-all'}
              >
                <Trash2 size={18} color={noServers ? colors.text.disabled : colors.text.inverted} aria-hidden />
                {t('gallery.actions.deleteAll')}
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
                <Folder size={18} color={noServers ? colors.text.disabled : colors.text.default} aria-hidden />
                {breadcrumbItems.length > 0 ? t('gallery.actions.newSubalbum') : t('gallery.actions.newAlbum')}
              </Button>

              <Button onPress={onUpload} loading={isUploading}>
                <Plus size={18} color={colors.text.inverted} aria-hidden />
                {t('gallery.actions.upload')}
              </Button>
            </>
          )}
        </View>
      </View>

      {isSelectionMode ? (
        <View
          className="gap-2 rounded-lg border p-3"
          style={{ backgroundColor: colors.surface.default, borderColor: colors.border.default }}
        >
          <View className="flex-row flex-wrap items-center gap-2">
            <Button
              variant="tertiary"
              size="small"
              onPress={onClearSelection}
              accessibilityLabel={t('gallery.actions.clearSelection')}
            >
              <X size={18} color={colors.text.default} aria-hidden />
            </Button>
            <Text style={{ marginRight: 'auto' }}>{selectedPhotoCountLabel}</Text>

            {isTrashMode ? (
              <>
                <Button variant="secondary" onPress={onRestoreSelected} loading={pendingAction === 'restore'}>
                  <Check size={18} color={colors.text.default} aria-hidden />
                  {t('gallery.actions.restoreSelected')}
                </Button>
                <Button
                  variant="destructive"
                  onPress={onDeleteSelectedPermanently}
                  loading={pendingAction === 'delete-permanently'}
                >
                  <Trash2 size={18} color={colors.text.inverted} aria-hidden />
                  {t('gallery.actions.deletePermanently')}
                </Button>
              </>
            ) : (
              <>
                <Button variant="secondary" onPress={onCreateAlbum} disabled={!hasSelectedServer}>
                  <Folder
                    size={18}
                    color={hasSelectedServer ? colors.text.default : colors.text.disabled}
                    aria-hidden
                  />
                  {t('gallery.actions.newAlbum')}
                </Button>
                <Button variant="secondary" onPress={onAddToAlbum} disabled={!hasSelectedServer}>
                  <Folder
                    size={18}
                    color={hasSelectedServer ? colors.text.default : colors.text.disabled}
                    aria-hidden
                  />
                  {t('gallery.actions.addToAlbum')}
                </Button>
                <Button variant="secondary" onPress={onTrashSelected} loading={pendingAction === 'trash'}>
                  <Trash2 size={18} color={colors.text.default} aria-hidden />
                  {t('gallery.actions.trash')}
                </Button>
              </>
            )}
          </View>

          {!isTrashMode && !hasSelectedServer ? (
            <Text.S color={theme.colors.text.secondary}>{t('gallery.singleServerRequired')}</Text.S>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
