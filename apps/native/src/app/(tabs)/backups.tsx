import { useEffect, useState } from 'react';
import { Pressable, View, useWindowDimensions } from 'react-native';
import { type BackupResponse, type CreateBackupRequest, type UpdateBackupRequest } from '@repo/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ServerType } from '@/api/_client';
import { BaseLayout } from '@/components/base-layout';
import {
  NativeSelectScrollView,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/form/select';
import { Input } from '@/components/form/input';
import { Button } from '@/components/general/button';
import { Icon } from '@/components/general/icon';
import { Text } from '@/components/general/text';
import { toast } from '@/lib/toast';
import { type ServerConnectionWithClient, useServerContext } from '@/providers/ServerProvider';

type BackupListItem = BackupResponse & {
  ownerServerId: string;
  ownerServerLabel: string;
  ownerServerBaseUrl: string;
};

const DEFAULT_SCHEDULE = '0 2 * * *';

const createLocalId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;

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

const formatDateTime = (value?: string | Date | null) => {
  if (!value) {
    return 'Never';
  }

  return new Date(value).toLocaleString();
};

const formatMaybeDateTime = (value?: string | Date | null) => {
  if (!value) {
    return 'Not scheduled';
  }

  return new Date(value).toLocaleString();
};

const compareBackups = (left: BackupListItem, right: BackupListItem) => {
  const updatedDifference = +new Date(right.updatedAt) - +new Date(left.updatedAt);

  if (updatedDifference !== 0) {
    return updatedDifference;
  }

  return right.id.localeCompare(left.id);
};

export default function BackupsPage() {
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

  const saveBackup = async () => {
    if (busyAction) {
      return;
    }

    if (!schedule.trim()) {
      toast.error('A cron schedule is required');
      return;
    }

    if (!hasMediaSelection) {
      toast.error('Select at least one media type');
      return;
    }

    setBusyAction('save');

    try {
      if (currentEditingBackup) {
        const { sourceServer, destinationServer, sourceConfigId, destinationConfigId } =
          resolveOutgoingTargets(currentEditingBackup);

        if (!sourceServer || !destinationServer || !sourceConfigId || !destinationConfigId) {
          throw new Error('Both source and destination servers must be connected to edit this backup');
        }

        const payload = buildPayload(sourceServer, destinationServer, {
          active: currentEditingBackup.active,
        });

        await Promise.all([
          sourceServer.client.backups.update(sourceConfigId, payload),
          destinationServer.client.backups.update(destinationConfigId, payload),
        ]);

        toast.success('Backup updated');
      } else {
        if (!selectedSourceServer || !selectedDestinationServer) {
          throw new Error('Select both a source and a destination server');
        }

        if (selectedSourceServer.id === selectedDestinationServer.id) {
          throw new Error('Source and destination servers must be different');
        }

        const pairId = createLocalId();
        const pairSecret = createLocalId();
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

        toast.success('Backup created');
      }

      resetForm();
      await refreshBackups();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to save backup');
    } finally {
      setBusyAction(null);
    }
  };

  const toggleBackup = async (backup: BackupListItem) => {
    if (busyAction) {
      return;
    }

    setBusyAction(`toggle:${backup.id}`);

    try {
      const { sourceServer, destinationServer, sourceConfigId, destinationConfigId } = resolveOutgoingTargets(backup);

      if (!sourceServer || !destinationServer || !sourceConfigId || !destinationConfigId) {
        throw new Error('Both source and destination servers must be connected to enable or disable this backup');
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

      toast.success(nextActive ? 'Backup enabled' : 'Backup disabled');
      await refreshBackups();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to update backup state');
    } finally {
      setBusyAction(null);
    }
  };

  const deleteBackup = async (backup: BackupListItem) => {
    if (busyAction) {
      return;
    }

    setBusyAction(`delete:${backup.id}`);

    try {
      const { sourceServer, destinationServer, sourceConfigId, destinationConfigId } = resolveOutgoingTargets(backup);
      const actions: Array<Promise<unknown>> = [];

      if (sourceServer && sourceConfigId) {
        actions.push(sourceServer.client.backups.remove(sourceConfigId));
      }

      if (destinationServer && destinationConfigId) {
        actions.push(destinationServer.client.backups.remove(destinationConfigId));
      }

      if (!actions.length) {
        throw new Error('No connected backup records were available to delete');
      }

      const results = await Promise.allSettled(actions);
      const rejected = results.filter((result) => result.status === 'rejected');

      if (rejected.length === results.length) {
        const [first] = rejected;
        throw first.status === 'rejected' ? first.reason : new Error('Unable to delete backup');
      }

      if (editingBackupId === backup.id) {
        resetForm();
      }

      toast.success('Backup deleted');
      if (rejected.length > 0) {
        toast.info('One side of the backup was removed, but the paired record could not be deleted automatically.');
      }
      await refreshBackups();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to delete backup');
    } finally {
      setBusyAction(null);
    }
  };

  const triggerBackup = async (backup: BackupListItem) => {
    if (busyAction) {
      return;
    }

    setBusyAction(`trigger:${backup.id}`);

    try {
      const { sourceServer, sourceConfigId } = resolveOutgoingTargets(backup);

      if (!sourceServer || !sourceConfigId) {
        throw new Error('The source backup record is not currently connected');
      }

      await sourceServer.client.backups.trigger(sourceConfigId);
      toast.success('Backup triggered');
      await refreshBackups();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to trigger backup');
    } finally {
      setBusyAction(null);
    }
  };

  const renderMediaToggle = (
    label: string,
    selected: boolean,
    onPress: () => void,
    description: string,
    disabled = false
  ) => (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`min-w-35 flex-1 rounded-xl border px-4 py-3 ${
        selected ? 'border-primary bg-primary/10' : 'border-border bg-background'
      } ${disabled ? 'opacity-50' : ''}`}
    >
      <Text className="font-medium">{label}</Text>
      <Text className="mt-1 text-xs text-muted-foreground">{description}</Text>
    </Pressable>
  );

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

  const formHeading = currentEditingBackup ? 'Edit backup' : 'Create backup';
  const formDescription = currentEditingBackup
    ? 'Schedules and media selection are updated on both servers. Use the card toggle to enable or disable a backup.'
    : 'Create a paired outgoing and incoming backup between two connected admin servers.';

  return (
    <BaseLayout>
      <View className="gap-6 pb-8">
        <View className="gap-1">
          <Text variant="h1">Backups</Text>
          <Text className="text-muted-foreground">
            Manage scheduled server-to-server backups. Outgoing records execute on the source server; incoming records
            store their own destination metadata.
          </Text>
        </View>

        {nonAdminServers.length > 0 ? (
          <View className="rounded-2xl border border-border bg-layer-secondary/30 p-4">
            <Text className="font-medium">Admin access required</Text>
            <Text className="mt-1 text-sm text-muted-foreground">
              {nonAdminServers.length} connected server{nonAdminServers.length === 1 ? '' : 's'} were ignored because
              the current account is not an admin there.
            </Text>
          </View>
        ) : null}

        <View className="gap-4 rounded-2xl border border-border bg-layer-secondary/30 p-4">
          <View className="flex-row items-center justify-between gap-3">
            <View className="flex-1 gap-1">
              <Text variant="h3">{formHeading}</Text>
              <Text className="text-sm text-muted-foreground">{formDescription}</Text>
            </View>

            {currentEditingBackup ? (
              <Button variant="ghost" onPress={resetForm} disabled={busyAction !== null}>
                <Icon.Close />
                <Text>Cancel</Text>
              </Button>
            ) : null}
          </View>

          {adminServers.length < 2 && !currentEditingBackup ? (
            <View className="rounded-xl border border-dashed border-border p-4">
              <Text className="font-medium">Two admin-connected servers are required</Text>
              <Text className="mt-1 text-sm text-muted-foreground">
                Connect and sign in as an admin on both the source and destination servers before creating a backup.
              </Text>
            </View>
          ) : null}

          <View className="gap-3">
            <Text className="text-sm text-muted-foreground">Source server</Text>
            {currentEditingBackup ? (
              <View className="rounded-xl border border-border bg-background px-3 py-3">
                <Text>{selectedSourceServer?.label ?? currentEditingBackup.sourceServerLabel}</Text>
                <Text className="text-xs text-muted-foreground">
                  {selectedSourceServer?.baseUrl ?? currentEditingBackup.sourceServerBaseUrl}
                </Text>
              </View>
            ) : (
              <Select
                value={sourceOptions.find((option) => option.value === selectedSourceId)}
                onValueChange={(option) => setSelectedSourceId(option?.value ?? '')}
                disabled={adminServers.length < 2}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select source server" />
                </SelectTrigger>
                <SelectContent>
                  <NativeSelectScrollView>
                    {sourceOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value} label={option.label} />
                    ))}
                  </NativeSelectScrollView>
                </SelectContent>
              </Select>
            )}
          </View>

          <View className="gap-3">
            <Text className="text-sm text-muted-foreground">Destination server</Text>
            {currentEditingBackup ? (
              <View className="rounded-xl border border-border bg-background px-3 py-3">
                <Text>{selectedDestinationServer?.label ?? currentEditingBackup.destinationServerLabel}</Text>
                <Text className="text-xs text-muted-foreground">
                  {selectedDestinationServer?.baseUrl ?? currentEditingBackup.destinationServerBaseUrl}
                </Text>
              </View>
            ) : (
              <Select
                value={destinationOptions.find((option) => option.value === selectedDestinationId)}
                onValueChange={(option) => setSelectedDestinationId(option?.value ?? '')}
                disabled={adminServers.length < 2}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select destination server" />
                </SelectTrigger>
                <SelectContent>
                  <NativeSelectScrollView>
                    {destinationOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value} label={option.label} />
                    ))}
                  </NativeSelectScrollView>
                </SelectContent>
              </Select>
            )}
          </View>

          <View className="gap-3">
            <Text className="text-sm text-muted-foreground">What should be copied</Text>
            <View className="flex-row flex-wrap gap-3">
              {renderMediaToggle(
                'Photos',
                copyPhotos,
                () => setCopyPhotos((value) => !value),
                'Storage files and photo originals'
              )}
              {renderMediaToggle('Files', copyFiles, () => setCopyFiles((value) => !value), 'Shared file directories')}
              {renderMediaToggle(
                'Notes',
                copyNotes,
                () => setCopyNotes((value) => !value),
                'Structured note snapshots'
              )}
            </View>
          </View>

          <View className="gap-2">
            <Text className="text-sm text-muted-foreground">Schedule</Text>
            <Input value={schedule} onChangeText={setSchedule} placeholder="0 2 * * *" autoCapitalize="none" />
          </View>

          <View className="flex-row flex-wrap justify-end gap-3">
            {currentEditingBackup ? (
              <Button variant="outline" onPress={resetForm} disabled={busyAction !== null}>
                <Text>Reset</Text>
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
              <Icon.Check className="text-black" />
              <Text>{currentEditingBackup ? 'Save changes' : 'Create backup'}</Text>
            </Button>
          </View>
        </View>

        <View className="gap-3">
          <Text variant="h3">Outgoing backups</Text>
          <Text className="text-sm text-muted-foreground">
            Manage backups from the source-side record. Destination records stay in sync automatically and surface here
            when available.
          </Text>
          {adminServers.length === 0 ? (
            <View className="rounded-2xl border border-dashed border-border p-6">
              <Text variant="h3">No admin-connected servers</Text>
              <Text className="text-muted-foreground">
                Connect at least one core server as an admin to load backups.
              </Text>
            </View>
          ) : isLoading ? (
            <View className="rounded-2xl border border-border bg-layer-secondary/30 p-6">
              <Text className="text-muted-foreground">Loading backups...</Text>
            </View>
          ) : outgoingBackups.length === 0 ? (
            <View className="rounded-2xl border border-dashed border-border p-6">
              <Text variant="h3">No outgoing backups yet</Text>
              <Text className="text-muted-foreground">
                Create one above to start scheduling backups from a source server.
              </Text>
            </View>
          ) : (
            <View className="flex-row flex-wrap items-start gap-3">
              {outgoingBackups.map((backup) => {
                const { sourceServer, destinationServer, sourceConfigId, destinationConfigId, incoming } =
                  resolveOutgoingTargets(backup);
                const canManage = Boolean(sourceServer && destinationServer && sourceConfigId && destinationConfigId);
                const displayedStats = incoming?.stats ?? backup.stats;
                const displayedDestinationPath =
                  incoming?.destinationPath ?? backup.destinationPath ?? 'Not linked yet';

                return (
                  <View
                    key={`${backup.ownerServerId}:${backup.id}`}
                    className="rounded-2xl border border-border bg-layer-secondary/40 p-4"
                    style={{ width: cardWidth }}
                  >
                    <View className="flex-row items-start justify-between gap-3">
                      <View className="flex-1 gap-2">
                        <View className="flex-row flex-wrap items-center gap-2">
                          <Text className="text-lg font-semibold">{backup.sourceServerLabel}</Text>
                          <View className={`rounded-full px-2.5 py-1 ${backup.active ? 'bg-primary/10' : 'bg-muted'}`}>
                            <Text className="text-xs text-muted-foreground">
                              {backup.active ? 'Enabled' : 'Disabled'}
                            </Text>
                          </View>
                          {backup.running ? (
                            <View className="rounded-full bg-amber-500/10 px-2.5 py-1">
                              <Text className="text-xs text-amber-700">Running</Text>
                            </View>
                          ) : null}
                        </View>
                        <Text className="text-sm text-muted-foreground">
                          {backup.sourceServerLabel} to {backup.destinationServerLabel}
                        </Text>
                        <Text className="text-xs text-muted-foreground">Stored on {backup.ownerServerLabel}</Text>
                      </View>

                      <View className="gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onPress={() => startEditing(backup)}
                          disabled={!canManage || busyAction !== null}
                        >
                          <Icon.Edit />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onPress={() => toggleBackup(backup)}
                          disabled={!canManage || busyAction !== null}
                        >
                          <Icon.CheckCircle className={backup.active ? 'text-primary' : 'text-muted-foreground'} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onPress={() => deleteBackup(backup)}
                          disabled={busyAction !== null}
                        >
                          <Icon.Trash />
                        </Button>
                      </View>
                    </View>

                    <View className="mt-4 flex-row flex-wrap gap-2">
                      {backup.copyPhotos ? (
                        <View className="rounded-full border border-border bg-background px-2.5 py-1">
                          <Text className="text-xs text-muted-foreground">Photos</Text>
                        </View>
                      ) : null}
                      {backup.copyFiles ? (
                        <View className="rounded-full border border-border bg-background px-2.5 py-1">
                          <Text className="text-xs text-muted-foreground">Files</Text>
                        </View>
                      ) : null}
                      {backup.copyNotes ? (
                        <View className="rounded-full border border-border bg-background px-2.5 py-1">
                          <Text className="text-xs text-muted-foreground">Notes</Text>
                        </View>
                      ) : null}
                    </View>

                    <View className="mt-4 gap-2">
                      <Text className="text-sm text-muted-foreground">Schedule {backup.schedule}</Text>
                      <Text className="text-sm text-muted-foreground">Runs {backup.runCount} times</Text>
                      <Text className="text-sm text-muted-foreground">
                        Last execution {formatDateTime(backup.lastRunAt)}
                      </Text>
                      <Text className="text-sm text-muted-foreground">
                        Next execution {formatMaybeDateTime(backup.nextRunAt)}
                      </Text>
                      <Text className="text-sm text-muted-foreground">Destination path {displayedDestinationPath}</Text>
                    </View>

                    <View className="mt-4 rounded-xl border border-border bg-background/60 p-3">
                      <Text className="font-medium">Stored stats</Text>
                      <View className="mt-2 gap-1">
                        <Text className="text-sm text-muted-foreground">
                          Photos: {displayedStats?.photos.count ?? 0} files,{' '}
                          {formatBytes(displayedStats?.photos.sizeBytes)}
                        </Text>
                        <Text className="text-sm text-muted-foreground">
                          Files: {displayedStats?.files.count ?? 0} files,{' '}
                          {formatBytes(displayedStats?.files.sizeBytes)}
                        </Text>
                        <Text className="text-sm text-muted-foreground">
                          Notes: {displayedStats?.notes.count ?? 0} items,{' '}
                          {formatBytes(displayedStats?.notes.sizeBytes)}
                        </Text>
                        <Text className="text-sm text-muted-foreground">
                          Total: {displayedStats?.totalCount ?? 0} items, {formatBytes(displayedStats?.totalSizeBytes)}
                        </Text>
                      </View>
                    </View>

                    {!incoming ? (
                      <View className="mt-4 rounded-xl border border-border bg-background/60 p-3">
                        <Text className="text-sm text-muted-foreground">
                          The destination-side record is not currently loaded. Management actions stay disabled until
                          both servers respond.
                        </Text>
                      </View>
                    ) : null}

                    {backup.lastError ? (
                      <View className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3">
                        <Text className="font-medium text-destructive">Last error</Text>
                        <Text className="mt-1 text-sm text-destructive">{backup.lastError}</Text>
                      </View>
                    ) : null}

                    <View className="mt-4 flex-row gap-3">
                      <Button
                        variant="secondary"
                        onPress={() => triggerBackup(backup)}
                        loading={busyAction === `trigger:${backup.id}`}
                        disabled={!sourceConfigId || !sourceServer || busyAction !== null}
                        className="flex-1"
                      >
                        <Text>Trigger now</Text>
                      </Button>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </View>
    </BaseLayout>
  );
}
