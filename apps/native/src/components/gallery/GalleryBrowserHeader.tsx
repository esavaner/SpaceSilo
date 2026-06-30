import { Breadcrumb, type BreadcrumbItem } from '@/components/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/dropdowns/dropdown';
import { Button } from '@/components/general/button';
import { Icon } from '@/components/general/icon';
import { Text } from '@/components/general/text';
import { View } from 'react-native';

type LabelledOption<T extends string> = {
  label: string;
  value: T;
};

type GalleryBrowserHeaderProps<GroupBy extends string, ViewMode extends string, PendingAction extends string> = {
  isTrashMode: boolean;
  title: string;
  breadcrumbItems: BreadcrumbItem[];
  viewModeOptions: LabelledOption<ViewMode>[];
  viewMode: ViewMode;
  onViewModeChange: (value: ViewMode) => void;
  groupByOptions: LabelledOption<GroupBy>[];
  groupBy: GroupBy;
  onGroupByChange: (value: GroupBy) => void;
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
  options,
  value,
  fallbackLabel,
  onChange,
}: {
  options: LabelledOption<T>[];
  value: T;
  fallbackLabel: string;
  onChange: (value: T) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button variant="outline">
          <Text>{options.find((option) => option.value === value)?.label ?? fallbackLabel}</Text>
          <Icon.ChevronDown className="text-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {options.map((option) => (
          <DropdownMenuItem key={option.value} onPress={() => onChange(option.value)}>
            <Text className="flex-1">{option.label}</Text>
            {value === option.value ? <Icon.Check className="text-foreground" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function GalleryBrowserHeader<GroupBy extends string, ViewMode extends string, PendingAction extends string>({
  isTrashMode,
  title,
  breadcrumbItems,
  viewModeOptions,
  viewMode,
  onViewModeChange,
  groupByOptions,
  groupBy,
  onGroupByChange,
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
  return (
    <View className="gap-4">
      <View className="flex-row flex-wrap items-start justify-between gap-3">
        <View className="gap-2">
          <Text variant="h1">{title}</Text>
          {!isTrashMode && breadcrumbItems.length > 0 ? <Breadcrumb items={breadcrumbItems} /> : null}
        </View>

        <View className="flex-row flex-wrap items-center gap-2">
          {isTrashMode ? (
            <>
              <Button
                variant="outline"
                onPress={onRestoreAll}
                disabled={serverCount === 0}
                loading={pendingAction === 'restore-all'}
              >
                <Icon.Check className="text-foreground" />
                <Text>Restore all</Text>
              </Button>
              <Button
                variant="destructive"
                onPress={onDeleteAll}
                disabled={serverCount === 0}
                loading={pendingAction === 'delete-all'}
              >
                <Icon.Trash className="text-white" />
                <Text>Delete everything permanently</Text>
              </Button>
            </>
          ) : (
            <>
              <OptionMenu
                options={viewModeOptions}
                value={viewMode}
                fallbackLabel="Photos only"
                onChange={onViewModeChange}
              />

              <OptionMenu options={groupByOptions} value={groupBy} fallbackLabel="Day" onChange={onGroupByChange} />

              <Button variant="outline" onPress={onCreateAlbum} disabled={serverCount === 0}>
                <Icon.Folder className="text-foreground" />
                <Text>{breadcrumbItems.length > 0 ? 'New subalbum' : 'New album'}</Text>
              </Button>

              <Button onPress={onUpload} loading={isUploading}>
                <Icon.Add className="text-primary-foreground" />
                <Text>Upload</Text>
              </Button>
            </>
          )}
        </View>
      </View>

      {isSelectionMode ? (
        <View className="gap-2 rounded-lg border border-border bg-background p-3">
          <View className="flex-row flex-wrap items-center gap-2">
            <Button variant="ghost" size="icon" onPress={onClearSelection}>
              <Icon.Close />
            </Button>
            <Text className="mr-auto">{selectedPhotoCountLabel}</Text>

            {isTrashMode ? (
              <>
                <Button variant="outline" onPress={onRestoreSelected} loading={pendingAction === 'restore'}>
                  <Icon.Check className="text-foreground" />
                  <Text>Restore selected</Text>
                </Button>
                <Button
                  variant="destructive"
                  onPress={onDeleteSelectedPermanently}
                  loading={pendingAction === 'delete-permanently'}
                >
                  <Icon.Trash className="text-white" />
                  <Text>Delete permanently</Text>
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onPress={onCreateAlbum} disabled={!hasSelectedServer}>
                  <Icon.Folder className="text-foreground" />
                  <Text>New album</Text>
                </Button>
                <Button variant="outline" onPress={onAddToAlbum} disabled={!hasSelectedServer}>
                  <Icon.Folder className="text-foreground" />
                  <Text>Add to album</Text>
                </Button>
                <Button variant="outline" onPress={onTrashSelected} loading={pendingAction === 'trash'}>
                  <Icon.Trash className="text-foreground" />
                  <Text>Trash</Text>
                </Button>
              </>
            )}
          </View>

          {!isTrashMode && !hasSelectedServer ? (
            <Text className="text-sm text-muted-foreground">Album actions require photos from a single server.</Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
