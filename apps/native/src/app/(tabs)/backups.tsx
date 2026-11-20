import { useEffect, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { type BackupResponse, type CreateBackupRequest, type UpdateBackupRequest } from '@repo/shared';
import { Button, Icon, Input, Select, Text, theme, useThemeColors } from '@repo/shared/components';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import styled from 'styled-components/native';
import { ServerType } from '@/api/_client';
import { tApiErr } from '@/i18n/translate';
import { BaseLayout, BaseLayoutHeading } from '@/components/base-layout';
import { toast } from '@/lib/toast';
import { type ServerConnectionWithClient, useServerContext } from '@/providers/ServerProvider';
import { createId } from '@/utils/common';
import { useTranslation } from 'react-i18next';

const MutedText = styled(Text.M)`
  color: ${theme.colors.text.secondary};
`;
const SmallText = styled(Text.S)`
  color: ${theme.colors.text.secondary};
`;
const CaptionText = styled(Text.Caption)`
  color: ${theme.colors.text.secondary};
`;
const Panel = styled.View`
  gap: ${theme.spacing[400]};
  padding: ${theme.spacing[400]};
  border: 1px solid ${theme.colors.border.default};
  border-radius: ${theme.radius[400]};
  background-color: ${theme.colors.surface.medium};
`;
const Notice = styled.View`
  gap: ${theme.spacing[100]};
  padding: ${theme.spacing[400]};
  border: 1px solid ${theme.colors.border.default};
  border-radius: ${theme.radius[400]};
  background-color: ${theme.colors.surface.medium};
`;
const FormHeader = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.spacing[300]};
`;
const FormHeaderText = styled.View`
  flex: 1;
  gap: ${theme.spacing[50]};
`;
const FormSection = styled.View`
  gap: ${theme.spacing[300]};
`;
const ServerSummary = styled.View`
  padding: ${theme.spacing[300]};
  border: 1px solid ${theme.colors.border.default};
  border-radius: ${theme.radius[300]};
  background-color: ${theme.colors.surface.weak};
`;
const MediaOptions = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: ${theme.spacing[300]};
`;
const MediaOption = styled.Pressable<{ $selected: boolean }>`
  flex: 1;
  min-width: 140px;
  padding: ${theme.spacing[300]} ${theme.spacing[400]};
  border: 1px solid ${({ $selected }) => ($selected ? theme.colors.border.primary.default : theme.colors.border.default)};
  border-radius: ${theme.radius[300]};
  background-color: ${({ $selected }) => ($selected ? theme.colors.surface.medium : theme.colors.surface.weak)};
`;
const OptionTitle = styled(Text.M)`
  font-weight: 600;
`;
const SourceTitle = styled(Text.M)`
  font-size: ${theme.fontSize.lg};
  font-weight: 600;
`;
const FormActions = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: ${theme.spacing[300]};
`;
const ListSection = styled.View`
  gap: ${theme.spacing[300]};
`;
const EmptyState = styled.View`
  gap: ${theme.spacing[100]};
  padding: ${theme.spacing[600]};
  border: 1px dashed ${theme.colors.border.default};
  border-radius: ${theme.radius[400]};
`;
const BackupList = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: ${theme.spacing[300]};
`;
const BackupCard = styled.View`
  padding: ${theme.spacing[400]};
  border: 1px solid ${theme.colors.border.default};
  border-radius: ${theme.radius[400]};
  background-color: ${theme.colors.surface.medium};
`;
const CardHeader = styled.View`
  flex-direction: row;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${theme.spacing[300]};
`;
const CardMain = styled.View`
  flex: 1;
  gap: ${theme.spacing[200]};
`;
const BadgeRow = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: ${theme.spacing[200]};
`;
const Badge = styled.View<{ $running?: boolean; $active?: boolean }>`
  padding: ${theme.spacing[100]} ${theme.spacing[300]};
  border-radius: ${theme.radius.full};
  background-color: ${({ $running, $active }) =>
    $running ? theme.colors.warning.default : $active ? theme.colors.surface.medium : theme.colors.surface.stronger};
`;
const BadgeLabel = styled(Text.Caption)<{ $running?: boolean; $active?: boolean }>`
  color: ${({ $running, $active }) =>
    $running ? theme.colors.text.warningDarker : $active ? theme.colors.text.brand : theme.colors.text.secondary};
`;
const CardActions = styled.View`
  gap: ${theme.spacing[200]};
`;
const ActionButton = styled(Button)`
  align-self: flex-start;
  width: 40px;
  height: 40px;
  padding: 0;
`;
const MediaTags = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: ${theme.spacing[200]};
  margin-top: ${theme.spacing[400]};
`;
const MediaTag = styled.View`
  padding: ${theme.spacing[100]} ${theme.spacing[300]};
  border: 1px solid ${theme.colors.border.default};
  border-radius: ${theme.radius.full};
  background-color: ${theme.colors.surface.weak};
`;
const CardDetails = styled.View`
  gap: ${theme.spacing[200]};
  margin-top: ${theme.spacing[400]};
`;
const InfoPanel = styled.View`
  gap: ${theme.spacing[200]};
  margin-top: ${theme.spacing[400]};
  padding: ${theme.spacing[300]};
  border: 1px solid ${theme.colors.border.default};
  border-radius: ${theme.radius[300]};
  background-color: ${theme.colors.surface.weak};
`;
const StatsContent = styled.View`
  gap: ${theme.spacing[50]};
`;
const ErrorPanel = styled.View`
  gap: ${theme.spacing[100]};
  margin-top: ${theme.spacing[400]};
  padding: ${theme.spacing[300]};
  border: 1px solid ${theme.colors.border.error.default};
  border-radius: ${theme.radius[300]};
  background-color: ${theme.colors.error.default};
`;
const ErrorText = styled(Text.M)`
  color: ${theme.colors.text.danger};
  font-weight: 600;
`;
const ErrorDetails = styled(Text.S)`
  color: ${theme.colors.text.danger};
`;
const TriggerRow = styled.View`
  flex-direction: row;
  gap: ${theme.spacing[300]};
  margin-top: ${theme.spacing[400]};
`;

type BackupListItem = BackupResponse & {
  ownerServerId: string;
  ownerServerLabel: string;
  ownerServerBaseUrl: string;
};

const DEFAULT_SCHEDULE = '0 2 * * *';

const sanitizeServerKey = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, '-')
    .replace(/^-+|-+$/g, '');

const normalizeBaseUrl = (value: string) => value.trim().replace(/\/+$/, '');

const getServerKey = (server: ServerConnectionWithClient) => {
  try {
    return sanitizeServerKey(new URL(server.baseUrl).host);
  } catch {
    return sanitizeServerKey(server.label || server.baseUrl || server.id);
  }
};

const formatBytes = (value?: number) => {
  if (!value) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = value;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size >= 10 || unitIndex === 0 ? size.toFixed(0) : size.toFixed(1)} ${units[unitIndex]}`;
};

const formatDateTime = (value: string | Date | null | undefined, language: string, fallback: string) => {
  if (!value) {
    return fallback;
  }

  return new Date(value).toLocaleString(language);
};

const compareBackups = (left: BackupListItem, right: BackupListItem) => {
  const updatedDifference = +new Date(right.updatedAt) - +new Date(left.updatedAt);

  if (updatedDifference !== 0) {
    return updatedDifference;
  }

  return right.id.localeCompare(left.id);
};

export default function BackupsPage() {
  const { i18n, t } = useTranslation();
  const colors = useThemeColors();
  const { width } = useWindowDimensions();
  const queryClient = useQueryClient();
  const { servers } = useServerContext();
  const adminServers = servers.filter(
    (server) => server.type === ServerType.CORE && server.client.account?.role === 'admin'
  );
  const nonAdminServers = servers.filter(
    (server) => server.type === ServerType.CORE && server.client.account?.role !== 'admin'
  );

  const [editingBackupId, setEditingBackupId] = useState<string | null>(null);
  const [selectedSourceId, setSelectedSourceId] = useState('');
  const [selectedDestinationId, setSelectedDestinationId] = useState('');
  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE);
  const [copyPhotos, setCopyPhotos] = useState(false);
  const [copyFiles, setCopyFiles] = useState(false);
  const [copyNotes, setCopyNotes] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const { data: backups = [], isLoading } = useQuery({
    queryKey: ['backups', adminServers.map((server) => server.id)],
    queryFn: async () => {
      if (!adminServers.length) {
        return [] as BackupListItem[];
      }

      const responses = await Promise.all(
        adminServers.map(async (server) => {
          try {
            const data = await server.client.backups.findAll();
            return data.map(
              (backup) =>
                ({
                  ...backup,
                  ownerServerId: server.id,
                  ownerServerLabel: server.label,
                  ownerServerBaseUrl: server.baseUrl,
                }) satisfies BackupListItem
            );
          } catch {
            return [] as BackupListItem[];
          }
        })
      );

      return responses.flat().sort(compareBackups);
    },
    enabled: adminServers.length > 0,
  });

  const outgoingBackups = backups.filter((backup) => backup.direction === 'outgoing');
  const incomingByPairId = new Map(
    backups.filter((backup) => backup.direction === 'incoming').map((backup) => [backup.pairId, backup])
  );
  const currentEditingBackup = editingBackupId
    ? (outgoingBackups.find((backup) => backup.id === editingBackupId) ?? null)
    : null;
  const hasMediaSelection = copyPhotos || copyFiles || copyNotes;
  const selectedSourceServer = adminServers.find((server) => server.id === selectedSourceId) ?? null;
  const selectedDestinationServer = adminServers.find((server) => server.id === selectedDestinationId) ?? null;
  const columnCount = width > 1480 ? 3 : width > 980 ? 2 : 1;
  const availableWidth = Math.min(Math.max(width - 32, 280), 1360);
  const columnGap = 12;
  const cardWidth = columnCount === 1 ? availableWidth : (availableWidth - columnGap * (columnCount - 1)) / columnCount;

  useEffect(() => {
    if (editingBackupId) {
      return;
    }

    const first = adminServers[0];
    if (!first) {
      setSelectedSourceId('');
      setSelectedDestinationId('');
      return;
    }

    if (!adminServers.some((server) => server.id === selectedSourceId)) {
      setSelectedSourceId(first.id);
    }

    if (
      !adminServers.some((server) => server.id === selectedDestinationId) ||
      selectedDestinationId === selectedSourceId
    ) {
      const fallbackDestination =
        adminServers.find((server) => server.id !== (selectedSourceId || first.id)) ?? adminServers[1];
      setSelectedDestinationId(fallbackDestination?.id ?? '');
    }
  }, [adminServers, editingBackupId, selectedDestinationId, selectedSourceId]);

  const resetForm = () => {
    const first = adminServers[0];
    const second = adminServers.find((server) => server.id !== first?.id) ?? adminServers[1];
    setEditingBackupId(null);
    setSelectedSourceId(first?.id ?? '');
    setSelectedDestinationId(second?.id ?? '');
    setSchedule(DEFAULT_SCHEDULE);
    setCopyPhotos(false);
    setCopyFiles(false);
    setCopyNotes(false);
  };

  const findServerByBaseUrl = (baseUrl: string) => {
    const normalized = normalizeBaseUrl(baseUrl);
    return adminServers.find((server) => normalizeBaseUrl(server.baseUrl) === normalized) ?? null;
  };

  const resolveOutgoingTargets = (backup: BackupListItem) => {
    const incoming = incomingByPairId.get(backup.pairId);
    return {
      sourceServer:
        adminServers.find((server) => server.id === backup.ownerServerId) ??
        findServerByBaseUrl(backup.sourceServerBaseUrl),
      destinationServer: findServerByBaseUrl(backup.destinationServerBaseUrl),
      sourceConfigId: backup.id,
      destinationConfigId: incoming?.id ?? backup.remoteConfigId ?? null,
      incoming,
    };
  };

  const buildPayload = (
    sourceServer: ServerConnectionWithClient,
    destinationServer: ServerConnectionWithClient,
    overrides: Partial<CreateBackupRequest & UpdateBackupRequest> = {}
  ) => ({
    schedule: schedule.trim(),
    copyPhotos,
    copyFiles,
    copyNotes,
    sourceServerLabel: sourceServer.label,
    sourceServerBaseUrl: sourceServer.baseUrl,
    sourceServerKey: getServerKey(sourceServer),
    destinationServerLabel: destinationServer.label,
    destinationServerBaseUrl: destinationServer.baseUrl,
    destinationServerKey: getServerKey(destinationServer),
    ...overrides,
  });

  const refreshBackups = async () => {
    await queryClient.invalidateQueries({ queryKey: ['backups'] });
  };

  const startEditing = (backup: BackupListItem) => {
    const { sourceServer, destinationServer } = resolveOutgoingTargets(backup);
    setEditingBackupId(backup.id);
    setSelectedSourceId(sourceServer?.id ?? '');
    setSelectedDestinationId(destinationServer?.id ?? '');
    setSchedule(backup.schedule);
    setCopyPhotos(backup.copyPhotos);
    setCopyFiles(backup.copyFiles);
    setCopyNotes(backup.copyNotes);
  };

  const runAction = async (key: string, errorKey: string, action: () => Promise<void>) => {
    if (busyAction) {
      return;
    }

    setBusyAction(key);

    try {
      await action();
    } catch (error) {
      toast.error(tApiErr(t, error, errorKey));
    } finally {
      setBusyAction(null);
    }
  };

  const saveBackup = () =>
    runAction('save', 'backups.errors.save', async () => {
      if (!schedule.trim()) {
        toast.error(t('backups.errors.scheduleRequired'));
        return;
      }

      if (!hasMediaSelection) {
        toast.error(t('backups.errors.mediaRequired'));
        return;
      }

      if (currentEditingBackup) {
        const { sourceServer, destinationServer, sourceConfigId, destinationConfigId } =
          resolveOutgoingTargets(currentEditingBackup);

        if (!sourceServer || !destinationServer || !sourceConfigId || !destinationConfigId) {
          throw new Error(t('backups.errors.connectedForEdit'));
        }

        const payload = buildPayload(sourceServer, destinationServer, {
          active: currentEditingBackup.active,
        });

        await Promise.all([
          sourceServer.client.backups.update(sourceConfigId, payload),
          destinationServer.client.backups.update(destinationConfigId, payload),
        ]);

        toast.success(t('backups.toasts.updateSuccess'));
      } else {
        if (!selectedSourceServer || !selectedDestinationServer) {
          throw new Error(t('backups.errors.serversRequired'));
        }

        if (selectedSourceServer.id === selectedDestinationServer.id) {
          throw new Error(t('backups.errors.serversDifferent'));
        }

        const pairId = createId();
        const pairSecret = createId();
        const basePayload = {
          ...buildPayload(selectedSourceServer, selectedDestinationServer),
          pairId,
          pairSecret,
        } satisfies CreateBackupRequest;

        const incoming = await selectedDestinationServer.client.backups.createIncoming(basePayload);

        try {
          await selectedSourceServer.client.backups.createOutgoing({
            ...basePayload,
            destinationPath: incoming.destinationPath ?? undefined,
            remoteConfigId: incoming.id,
          });
        } catch (error) {
          await selectedDestinationServer.client.backups.remove(incoming.id).catch(() => undefined);
          throw error;
        }

        toast.success(t('backups.toasts.createSuccess'));
      }

      resetForm();
      await refreshBackups();
    });

  const toggleBackup = (backup: BackupListItem) =>
    runAction(`toggle:${backup.id}`, 'backups.errors.toggle', async () => {
      const { sourceServer, destinationServer, sourceConfigId, destinationConfigId } = resolveOutgoingTargets(backup);

      if (!sourceServer || !destinationServer || !sourceConfigId || !destinationConfigId) {
        throw new Error(t('backups.errors.connectedForToggle'));
      }

      const nextActive = !backup.active;
      const payload = {
        ...buildPayload(sourceServer, destinationServer, {
          schedule: backup.schedule,
          copyPhotos: backup.copyPhotos,
          copyFiles: backup.copyFiles,
          copyNotes: backup.copyNotes,
        }),
        active: nextActive,
      } satisfies UpdateBackupRequest;

      await Promise.all([
        sourceServer.client.backups.update(sourceConfigId, payload),
        destinationServer.client.backups.update(destinationConfigId, payload),
      ]);

      toast.success(nextActive ? t('backups.toasts.enableSuccess') : t('backups.toasts.disableSuccess'));
      await refreshBackups();
    });

  const deleteBackup = (backup: BackupListItem) =>
    runAction(`delete:${backup.id}`, 'backups.errors.delete', async () => {
      const { sourceServer, destinationServer, sourceConfigId, destinationConfigId } = resolveOutgoingTargets(backup);
      const actions: Array<Promise<unknown>> = [];

      if (sourceServer && sourceConfigId) {
        actions.push(sourceServer.client.backups.remove(sourceConfigId));
      }

      if (destinationServer && destinationConfigId) {
        actions.push(destinationServer.client.backups.remove(destinationConfigId));
      }

      if (!actions.length) {
        throw new Error(t('backups.errors.connectedForDelete'));
      }

      const results = await Promise.allSettled(actions);
      const rejected = results.filter((result) => result.status === 'rejected');

      if (rejected.length === results.length) {
        const [first] = rejected;
        throw first.status === 'rejected' ? first.reason : new Error(t('backups.errors.delete'));
      }

      if (editingBackupId === backup.id) {
        resetForm();
      }

      toast.success(t('backups.toasts.deleteSuccess'));
      if (rejected.length > 0) {
        toast.info(t('backups.toasts.deletePartial'));
      }
      await refreshBackups();
    });

  const triggerBackup = (backup: BackupListItem) =>
    runAction(`trigger:${backup.id}`, 'backups.errors.trigger', async () => {
      const { sourceServer, sourceConfigId } = resolveOutgoingTargets(backup);

      if (!sourceServer || !sourceConfigId) {
        throw new Error(t('backups.errors.sourceRecordUnavailable'));
      }

      await sourceServer.client.backups.trigger(sourceConfigId);
      toast.success(t('backups.toasts.triggerSuccess'));
      await refreshBackups();
    });

  const mediaOptions = [
    {
      key: 'photos',
      selected: copyPhotos,
      toggle: () => setCopyPhotos((value) => !value),
      title: t('backups.media.photos.title'),
      description: t('backups.media.photos.description'),
    },
    {
      key: 'files',
      selected: copyFiles,
      toggle: () => setCopyFiles((value) => !value),
      title: t('backups.media.files.title'),
      description: t('backups.media.files.description'),
    },
    {
      key: 'notes',
      selected: copyNotes,
      toggle: () => setCopyNotes((value) => !value),
      title: t('backups.media.notes.title'),
      description: t('backups.media.notes.description'),
    },
  ];

  const sourceOptions = adminServers.map((server) => ({
    value: server.id,
    label: `${server.label} (${server.baseUrl})`,
  }));

  const destinationOptions = adminServers
    .filter((server) => server.id !== selectedSourceId)
    .map((server) => ({
      value: server.id,
      label: `${server.label} (${server.baseUrl})`,
    }));

  const formHeading = currentEditingBackup ? t('backups.form.editTitle') : t('backups.form.createTitle');
  const formDescription = currentEditingBackup
    ? t('backups.form.editDescription')
    : t('backups.form.createDescription');

  return (
    <BaseLayout
      header={
        <BaseLayoutHeading>
          <Text.H1>{t('navigation.backups')}</Text.H1>
          <MutedText>{t('backups.subtitle')}</MutedText>
        </BaseLayoutHeading>
      }
    >
      {nonAdminServers.length > 0 ? (
        <Notice>
          <OptionTitle>{t('backups.adminAccessRequired')}</OptionTitle>
          <SmallText>
            {t('backups.adminIgnored', { serverCount: `${nonAdminServers.length} ${t('common.nouns.servers')}` })}
          </SmallText>
        </Notice>
      ) : null}

      <Panel>
        <FormHeader>
          <FormHeaderText>
            <Text.H3>{formHeading}</Text.H3>
            <SmallText>{formDescription}</SmallText>
          </FormHeaderText>

          {currentEditingBackup ? (
            <Button variant="tertiary" onPress={resetForm} disabled={busyAction !== null}>
              <Icon.X size={18} color={colors.text.brand} />
              {t('common.actions.cancel')}
            </Button>
          ) : null}
        </FormHeader>

        {adminServers.length < 2 && !currentEditingBackup ? (
          <EmptyState>
            <OptionTitle>{t('backups.form.needTwoServersTitle')}</OptionTitle>
            <SmallText>{t('backups.form.needTwoServersDescription')}</SmallText>
          </EmptyState>
        ) : null}

        <FormSection>
          <SmallText>{t('backups.form.sourceServer')}</SmallText>
          {currentEditingBackup ? (
            <ServerSummary>
              <Text>{selectedSourceServer?.label ?? currentEditingBackup.sourceServerLabel}</Text>
              <CaptionText>{selectedSourceServer?.baseUrl ?? currentEditingBackup.sourceServerBaseUrl}</CaptionText>
            </ServerSummary>
          ) : (
            <Select
              label={t('backups.form.sourceServer')}
              hideLabel
              placeholder={t('backups.form.sourceServer')}
              options={sourceOptions}
              value={selectedSourceId}
              onValueChange={setSelectedSourceId}
              disabled={adminServers.length < 2}
              containerStyle={{ width: '100%' }}
            />
          )}
        </FormSection>

        <FormSection>
          <SmallText>{t('backups.form.destinationServer')}</SmallText>
          {currentEditingBackup ? (
            <ServerSummary>
              <Text>{selectedDestinationServer?.label ?? currentEditingBackup.destinationServerLabel}</Text>
              <CaptionText>
                {selectedDestinationServer?.baseUrl ?? currentEditingBackup.destinationServerBaseUrl}
              </CaptionText>
            </ServerSummary>
          ) : (
            <Select
              label={t('backups.form.destinationServer')}
              hideLabel
              placeholder={t('backups.form.destinationServer')}
              options={destinationOptions}
              value={selectedDestinationId}
              onValueChange={setSelectedDestinationId}
              disabled={adminServers.length < 2}
              containerStyle={{ width: '100%' }}
            />
          )}
        </FormSection>

        <FormSection>
          <SmallText>{t('backups.media.title')}</SmallText>
          <MediaOptions>
            {mediaOptions.map((option) => (
              <MediaOption key={option.key} onPress={option.toggle} $selected={option.selected}>
                <OptionTitle>{option.title}</OptionTitle>
                <CaptionText>{option.description}</CaptionText>
              </MediaOption>
            ))}
          </MediaOptions>
        </FormSection>

        <FormSection>
          <SmallText>{t('backups.form.schedule')}</SmallText>
          <Input value={schedule} onChangeText={setSchedule} placeholder="0 2 * * *" autoCapitalize="none" />
        </FormSection>

        <FormActions>
          {currentEditingBackup ? (
            <Button variant="secondary" onPress={resetForm} disabled={busyAction !== null}>
              {t('backups.form.reset')}
            </Button>
          ) : null}
          <Button
            onPress={saveBackup}
            loading={busyAction === 'save'}
            disabled={
              !schedule.trim() ||
              !hasMediaSelection ||
              (!currentEditingBackup &&
                (!selectedSourceServer || !selectedDestinationServer || selectedSourceId === selectedDestinationId))
            }
          >
            <Icon.Check size={18} color={colors.text.inverted} />
            {currentEditingBackup ? t('backups.form.saveChanges') : t('backups.form.createTitle')}
          </Button>
        </FormActions>
      </Panel>

      <ListSection>
        <Text.H3>{t('backups.list.title')}</Text.H3>
        <SmallText>{t('backups.list.description')}</SmallText>
        {adminServers.length === 0 ? (
          <EmptyState>
            <Text.H3>{t('backups.list.noServersTitle')}</Text.H3>
            <MutedText>{t('backups.list.noServersDescription')}</MutedText>
          </EmptyState>
        ) : isLoading ? (
          <Panel>
            <MutedText>{t('backups.list.loading')}</MutedText>
          </Panel>
        ) : outgoingBackups.length === 0 ? (
          <EmptyState>
            <Text.H3>{t('backups.list.emptyTitle')}</Text.H3>
            <MutedText>{t('backups.list.emptyDescription')}</MutedText>
          </EmptyState>
        ) : (
          <BackupList>
            {outgoingBackups.map((backup) => {
              const { sourceServer, destinationServer, sourceConfigId, destinationConfigId, incoming } =
                resolveOutgoingTargets(backup);
              const canManage = Boolean(sourceServer && destinationServer && sourceConfigId && destinationConfigId);
              const displayedStats = incoming?.stats ?? backup.stats;
              const displayedDestinationPath =
                incoming?.destinationPath ?? backup.destinationPath ?? t('backups.list.notLinkedYet');
              const enabledMedia = [
                { key: 'photos', enabled: backup.copyPhotos, label: t('backups.media.photos.title') },
                { key: 'files', enabled: backup.copyFiles, label: t('backups.media.files.title') },
                { key: 'notes', enabled: backup.copyNotes, label: t('backups.media.notes.title') },
              ].filter((item) => item.enabled);

              return (
                <BackupCard key={`${backup.ownerServerId}:${backup.id}`} style={{ width: cardWidth }}>
                  <CardHeader>
                    <CardMain>
                      <BadgeRow>
                        <SourceTitle>{backup.sourceServerLabel}</SourceTitle>
                        <Badge $active={backup.active}>
                          <BadgeLabel $active={backup.active}>
                            {backup.active ? t('common.status.enabled') : t('common.status.disabled')}
                          </BadgeLabel>
                        </Badge>
                        {backup.running ? (
                          <Badge $running>
                            <BadgeLabel $running>{t('backups.list.running')}</BadgeLabel>
                          </Badge>
                        ) : null}
                      </BadgeRow>
                      <SmallText>
                        {t('backups.list.route', {
                          source: backup.sourceServerLabel,
                          destination: backup.destinationServerLabel,
                        })}
                      </SmallText>
                      <CaptionText>{t('backups.list.storedOn', { server: backup.ownerServerLabel })}</CaptionText>
                    </CardMain>

                    <CardActions>
                      <ActionButton
                        variant="tertiary"
                        onPress={() => startEditing(backup)}
                        disabled={!canManage || busyAction !== null}
                      >
                        <Icon.Pencil size={18} color={colors.text.brand} />
                      </ActionButton>
                      <ActionButton
                        variant="tertiary"
                        onPress={() => toggleBackup(backup)}
                        disabled={!canManage || busyAction !== null}
                      >
                        <Icon.CircleCheckBig
                          size={18}
                          color={backup.active ? colors.text.brand : colors.text.secondary}
                        />
                      </ActionButton>
                      <ActionButton
                        variant="tertiary"
                        onPress={() => deleteBackup(backup)}
                        disabled={busyAction !== null}
                      >
                        <Icon.Trash size={18} color={colors.text.brand} />
                      </ActionButton>
                    </CardActions>
                  </CardHeader>

                  <MediaTags>
                    {enabledMedia.map((item) => (
                      <MediaTag key={item.key}>
                        <CaptionText>{item.label}</CaptionText>
                      </MediaTag>
                    ))}
                  </MediaTags>

                  <CardDetails>
                    <SmallText>{t('backups.list.schedule', { schedule: backup.schedule })}</SmallText>
                    <SmallText>{t('backups.list.runCount', { runTotal: backup.runCount })}</SmallText>
                    <SmallText>
                      {t('backups.list.lastExecution', {
                        value: formatDateTime(backup.lastRunAt, i18n.language, t('common.status.never')),
                      })}
                    </SmallText>
                    <SmallText>
                      {t('backups.list.nextExecution', {
                        value: formatDateTime(backup.nextRunAt, i18n.language, t('common.status.notScheduled')),
                      })}
                    </SmallText>
                    <SmallText>{t('backups.list.destinationPath', { path: displayedDestinationPath })}</SmallText>
                  </CardDetails>

                  <InfoPanel>
                    <OptionTitle>{t('backups.stats.title')}</OptionTitle>
                    <StatsContent>
                      <SmallText>
                        {t('backups.stats.photos', {
                          fileCount: `${displayedStats?.photos.count ?? 0} ${t('common.nouns.files')}`,
                          size: formatBytes(displayedStats?.photos.sizeBytes),
                        })}
                      </SmallText>
                      <SmallText>
                        {t('backups.stats.files', {
                          fileCount: `${displayedStats?.files.count ?? 0} ${t('common.nouns.files')}`,
                          size: formatBytes(displayedStats?.files.sizeBytes),
                        })}
                      </SmallText>
                      <SmallText>
                        {t('backups.stats.notes', {
                          itemCount: `${displayedStats?.notes.count ?? 0} ${t('common.nouns.items')}`,
                          size: formatBytes(displayedStats?.notes.sizeBytes),
                        })}
                      </SmallText>
                      <SmallText>
                        {t('backups.stats.total', {
                          itemCount: `${displayedStats?.totalCount ?? 0} ${t('common.nouns.items')}`,
                          size: formatBytes(displayedStats?.totalSizeBytes),
                        })}
                      </SmallText>
                    </StatsContent>
                  </InfoPanel>

                  {!incoming ? (
                    <InfoPanel>
                      <SmallText>{t('backups.list.destinationRecordMissing')}</SmallText>
                    </InfoPanel>
                  ) : null}

                  {backup.lastError ? (
                    <ErrorPanel>
                      <ErrorText>{t('backups.list.lastError')}</ErrorText>
                      <ErrorDetails>
                        {backup.lastError.startsWith('api.') ? t(backup.lastError) : backup.lastError}
                      </ErrorDetails>
                    </ErrorPanel>
                  ) : null}

                  <TriggerRow>
                    <Button
                      variant="secondary"
                      onPress={() => triggerBackup(backup)}
                      loading={busyAction === `trigger:${backup.id}`}
                      disabled={!sourceConfigId || !sourceServer || busyAction !== null}
                      style={{ flex: 1 }}
                    >
                      {t('backups.list.triggerNow')}
                    </Button>
                  </TriggerRow>
                </BackupCard>
              );
            })}
          </BackupList>
        )}
      </ListSection>
    </BaseLayout>
  );
}
