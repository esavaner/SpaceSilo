import { useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { FileText, Pencil, Plus, Search, Trash2 } from 'lucide-react-native';
import styled from 'styled-components/native';
import { BaseLayout } from '@/components/base-layout';
import { IncludedGroupsDropdown, type IncludedGroupOption } from '@/components/dropdowns/IncludedGroups.dropdown';
import { NoteDetailsModal } from '@/components/modals/NoteDetails.modal';
import { NoteDeleteModal } from '@/components/modals/NoteDelete.modal';
import { NoteEditorModal } from '@/components/modals/NoteEditor.modal';
import { type GroupListItem, useGroupList } from '@/hooks/useGroupList';
import { type NoteListItem, useNoteList } from '@/hooks/useNoteList';
import { useServerContext } from '@/providers/ServerProvider';
import { useTranslation } from 'react-i18next';
import { Button, Input, Text, theme, useModal, useThemeColors } from '@repo/shared/components';

const PageContent = styled.View`
  gap: ${theme.spacing[600]};
  padding-bottom: ${theme.spacing[800]};
`;

const PageHeader = styled.View`
  gap: ${theme.spacing[300]};
`;

const HeadingRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.spacing[300]};
`;

const HeadingContent = styled.View`
  flex: 1;
  gap: ${theme.spacing[50]};
`;

const FiltersPanel = styled.View`
  gap: ${theme.spacing[300]};
  padding: ${theme.spacing[300]};
  border: ${theme.borderWeight[25]} solid ${theme.colors.border.default};
  border-radius: ${theme.radius[300]};
  background-color: ${theme.colors.surface.medium};
`;

const FilterRow = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: ${theme.spacing[200]};
`;

const NotesGrid = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: ${theme.spacing[300]};
`;

const NoteCard = styled.View<{ $width: number }>`
  width: ${({ $width }) => $width}px;
  padding: ${theme.spacing[400]};
  border: ${theme.borderWeight[25]} solid ${theme.colors.border.default};
  border-radius: ${theme.radius[400]};
  background-color: ${theme.colors.surface.medium};
`;

const NoteRow = styled.View`
  flex-direction: row;
  align-items: flex-start;
  gap: ${theme.spacing[300]};
`;

const NoteContent = styled.Pressable`
  flex: 1;
  gap: ${theme.spacing[300]};
`;

const NoteDetails = styled.View`
  gap: ${theme.spacing[200]};
`;

const TitleRow = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: ${theme.spacing[200]};
`;

const NoteTag = styled.View`
  padding: ${theme.spacing[100]} ${theme.spacing[200]};
  border: ${theme.borderWeight[25]} solid ${theme.colors.border.default};
  border-radius: ${theme.radius.full};
  background-color: ${theme.colors.surface.weak};
`;

const NoteActions = styled.View`
  gap: ${theme.spacing[200]};
`;

const EmptyState = styled.View`
  gap: ${theme.spacing[300]};
  padding: ${theme.spacing[600]};
  border: ${theme.borderWeight[25]} dashed ${theme.colors.border.default};
  border-radius: ${theme.radius[400]};
`;

const LoadingState = styled.View`
  padding: ${theme.spacing[600]};
  border: ${theme.borderWeight[25]} solid ${theme.colors.border.default};
  border-radius: ${theme.radius[400]};
  background-color: ${theme.colors.surface.medium};
`;

const getNoteTitle = (note: Pick<NoteListItem, 'title' | 'content'>, untitledLabel: string) => {
  const title = note.title?.trim();

  if (title) {
    return title;
  }

  const [firstLine] = note.content.split(/\r?\n/);
  const preview = firstLine?.trim() || untitledLabel;
  return preview.length > 72 ? `${preview.slice(0, 72).trimEnd()}...` : preview;
};

const getNotePreview = (content: string) => {
  const collapsed = content.replace(/\s+/g, ' ').trim();

  if (collapsed.length <= 180) {
    return collapsed;
  }

  return `${collapsed.slice(0, 180).trimEnd()}...`;
};

const formatUpdatedAt = (value: Date | string, language: string) => new Date(value).toLocaleString(language);

const getGroupLookupKey = (
  noteOrGroup: Pick<NoteListItem, 'groupId' | 'serverId'> | Pick<GroupListItem, 'id' | 'serverId'>
) =>
  'groupId' in noteOrGroup
    ? `${noteOrGroup.serverId}:${noteOrGroup.groupId}`
    : `${noteOrGroup.serverId}:${noteOrGroup.id}`;

export default function NotesPage() {
  const { i18n, t } = useTranslation();
  const colors = useThemeColors();
  const { width } = useWindowDimensions();
  const { openModal } = useModal();
  const { allServers, servers } = useServerContext();
  const { notes, isNotesLoading } = useNoteList();
  const { groups, includedGroups, isGroupsLoading, handleToggleIncludedGroup } = useGroupList();
  const [query, setQuery] = useState('');

  const groupLookup = new Map(groups.map((group) => [getGroupLookupKey(group), group]));
  const serverLookup = new Map(allServers.map((server) => [server.id, server]));
  const groupFilterOptions: IncludedGroupOption[] = groups.map((group) => ({
    key: getGroupLookupKey(group),
    label: group.name,
    serverId: group.serverId,
    serverLabel: serverLookup.get(group.serverId)?.label ?? t('common.messages.connectedServer'),
  }));
  const includedGroupKeys = includedGroups.map((group) => getGroupLookupKey(group));
  const includedGroupKeySet = new Set(includedGroupKeys);
  const normalizedQuery = query.trim().toLowerCase();
  const columnCount = width > 1480 ? 4 : width > 1120 ? 3 : width > 720 ? 2 : 1;
  const availableWidth = Math.min(Math.max(width - 32, 280), 1280);
  const columnGap = 12;
  const cardWidth = columnCount === 1 ? availableWidth : (availableWidth - columnGap * (columnCount - 1)) / columnCount;

  const visibleNotes = notes.filter((note) => {
    if (!includedGroupKeySet.has(getGroupLookupKey(note))) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const group = groupLookup.get(getGroupLookupKey(note));
    const serverLabel = serverLookup.get(note.serverId)?.label ?? '';

    return [getNoteTitle(note, t('notes.details.untitled')), note.content, group?.name ?? '', serverLabel].some(
      (value) => value.toLowerCase().includes(normalizedQuery)
    );
  });

  const openCreateModal = () => {
    openModal(
      <NoteEditorModal
        groups={groups}
        serverLabels={Object.fromEntries(allServers.map((server) => [server.id, server.label]))}
      />
    );
  };

  const openDetailsModal = (note: NoteListItem) => {
    const group = groupLookup.get(getGroupLookupKey(note));
    const serverLabel = serverLookup.get(note.serverId)?.label ?? t('common.messages.connectedServer');

    openModal(
      <NoteDetailsModal
        note={note}
        groups={groups}
        groupName={group?.name ?? t('common.messages.unknownGroup')}
        serverLabel={serverLabel}
      />
    );
  };

  const openEditModal = (note: NoteListItem) => {
    openModal(<NoteEditorModal note={note} groups={groups} />);
  };

  const openDeleteModal = (note: NoteListItem) => {
    openModal(<NoteDeleteModal note={note} />);
  };

  return (
    <BaseLayout>
      <PageContent>
        <PageHeader>
          <HeadingRow>
            <HeadingContent>
              <Text.H1>{t('navigation.notes')}</Text.H1>
              <Text.S color={colors.text.secondary}>
                {isNotesLoading || isGroupsLoading
                  ? t('notes.loading')
                  : `${visibleNotes.length} ${t('common.nouns.notes')} ${t('common.labels.inView')}`}
              </Text.S>
            </HeadingContent>

            <Button onPress={openCreateModal} disabled={groups.length === 0}>
              <Plus size={18} color={colors.text.inverted} />
              <Text.S color={colors.text.inverted}>{t('notes.actions.create')}</Text.S>
            </Button>
          </HeadingRow>

          <FiltersPanel>
            <Input
              value={query}
              onChangeText={setQuery}
              placeholder={t('notes.searchPlaceholder')}
              leftIcon={<Search size={16} color={colors.text.secondary} />}
            />

            <FilterRow>
              <IncludedGroupsDropdown
                options={groupFilterOptions}
                includedKeys={includedGroupKeys}
                title={t('notes.groupFilter.title')}
                includeLabel={t('notes.groupFilter.include')}
                emptyLabel={t('notes.groupFilter.empty')}
                onToggleIncluded={(key) => {
                  const group = groups.find((item) => getGroupLookupKey(item) === key);

                  if (group) {
                    handleToggleIncludedGroup(group);
                  }
                }}
              />
            </FilterRow>
          </FiltersPanel>
        </PageHeader>

        {servers.length === 0 ? (
          <EmptyState>
            <Text.H3>{t('notes.empty.noServersTitle')}</Text.H3>
            <Text.M color={colors.text.secondary}>{t('notes.empty.noServersDescription')}</Text.M>
          </EmptyState>
        ) : isNotesLoading || isGroupsLoading ? (
          <LoadingState>
            <Text.M color={colors.text.secondary}>{t('notes.loadingAll')}</Text.M>
          </LoadingState>
        ) : visibleNotes.length === 0 ? (
          <EmptyState>
            <Text.H3>{query.trim() ? t('notes.empty.noMatchesTitle') : t('notes.empty.noneTitle')}</Text.H3>
            <Text.M color={colors.text.secondary}>
              {query.trim() ? t('notes.empty.noMatchesDescription') : t('notes.empty.noneDescription')}
            </Text.M>
            {!query.trim() ? (
              <Button
                onPress={openCreateModal}
                disabled={groups.length === 0}
                style={{ alignSelf: 'flex-start' }}
              >
                <Plus size={18} color={colors.text.inverted} />
                <Text.S color={colors.text.inverted}>{t('notes.actions.createFirst')}</Text.S>
              </Button>
            ) : null}
          </EmptyState>
        ) : (
          <NotesGrid>
            {visibleNotes.map((note) => {
              const group = groupLookup.get(getGroupLookupKey(note));
              const serverLabel = serverLookup.get(note.serverId)?.label ?? t('common.messages.connectedServer');

              return (
                <NoteCard
                  key={`${note.serverId}:${note.id}`}
                  $width={cardWidth}
                >
                  <NoteRow>
                    <NoteContent onPress={() => openDetailsModal(note)}>
                      <NoteDetails>
                        <TitleRow>
                          <Text.L weight={700}>
                            {getNoteTitle(note, t('notes.details.untitled'))}
                          </Text.L>
                          <NoteTag>
                            <Text.Caption color={colors.text.secondary}>
                              {group?.name ?? t('common.messages.unknownGroup')}
                            </Text.Caption>
                          </NoteTag>
                          <NoteTag>
                            <Text.Caption color={colors.text.secondary}>{serverLabel}</Text.Caption>
                          </NoteTag>
                        </TitleRow>

                        <Text.S color={colors.text.secondary} numberOfLines={3}>
                          {getNotePreview(note.content)}
                        </Text.S>
                      </NoteDetails>

                      <Text.Caption color={colors.text.secondary}>
                        {t('notes.details.updated', { value: formatUpdatedAt(note.updatedAt, i18n.language) })}
                      </Text.Caption>
                    </NoteContent>

                    <NoteActions>
                      <Button
                        variant="tertiary"
                        size="small"
                        style={{ width: 40, height: 40, padding: 0 }}
                        onPress={() => openDetailsModal(note)}
                      >
                        <FileText size={18} color={colors.text.brand} />
                      </Button>
                      <Button
                        variant="tertiary"
                        size="small"
                        style={{ width: 40, height: 40, padding: 0 }}
                        onPress={() => openEditModal(note)}
                      >
                        <Pencil size={18} color={colors.text.brand} />
                      </Button>
                      <Button
                        variant="tertiary"
                        size="small"
                        style={{ width: 40, height: 40, padding: 0 }}
                        onPress={() => openDeleteModal(note)}
                      >
                        <Trash2 size={18} color={colors.text.brand} />
                      </Button>
                    </NoteActions>
                  </NoteRow>
                </NoteCard>
              );
            })}
          </NotesGrid>
        )}
      </PageContent>
    </BaseLayout>
  );
}
