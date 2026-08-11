import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { fileSize } from '@/utils/common';
import { useServerContext } from '@/providers/ServerProvider';
import { Text } from '../general/text';
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from './dialog';
import { type FileListItem } from '@/hooks/useFileList';

type FileInfoModalProps = {
  file: FileListItem;
};

type DetailRowProps = {
  label: string;
  value: string;
};

const DetailRow = ({ label, value }: DetailRowProps) => (
  <View className="gap-1 border-b border-border pb-3">
    <Text className="text-muted-foreground text-sm">{label}</Text>
    <Text selectable className="text-foreground">
      {value}
    </Text>
  </View>
);

export const FileInfoModal = ({ file }: FileInfoModalProps) => {
  const { t, i18n } = useTranslation();
  const { allServers } = useServerContext();
  const server = allServers.find((item) => item.id === file.serverId);
  const {
    data: fileInfo,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['file-info', file.serverId, file.groupId, file.uri],
    queryFn: () => server!.client.files.info({ groupId: file.groupId, fileUri: file.uri }),
    enabled: Boolean(server),
  });

  const formatDate = (value: Date | string) => new Date(value).toLocaleString(i18n.language);
  const type = fileInfo?.isDirectory
    ? t('files.infoModal.folder')
    : fileInfo?.type
      ? fileInfo.type.toUpperCase()
      : t('files.infoModal.unknown');

  return (
    <DialogContent className="max-h-[80vh]">
      <DialogHeader>
        <DialogTitle>{t('files.infoModal.title')}</DialogTitle>
        <DialogDescription>{file.name}</DialogDescription>
      </DialogHeader>
      {isLoading && <Text className="text-muted-foreground">{t('files.infoModal.loading')}</Text>}
      {(isError || !server) && <Text className="text-destructive">{t('files.infoModal.unavailable')}</Text>}
      {fileInfo && (
        <ScrollView className="max-h-120" contentContainerClassName="gap-3 pr-2">
          <DetailRow label={t('files.infoModal.labels.name')} value={fileInfo.name} />
          <DetailRow label={t('files.infoModal.labels.type')} value={type} />
          {!fileInfo.isDirectory && (
            <DetailRow label={t('files.infoModal.labels.size')} value={fileSize(fileInfo.size ?? 0)} />
          )}
          <DetailRow label={t('files.infoModal.labels.modified')} value={formatDate(fileInfo.modificationTime)} />
          <DetailRow label={t('files.infoModal.labels.created')} value={formatDate(fileInfo.createdAt)} />
          <DetailRow label={t('files.infoModal.labels.path')} value={fileInfo.uri} />
          {!fileInfo.isDirectory && fileInfo.md5 && (
            <DetailRow label={t('files.infoModal.labels.checksum')} value={fileInfo.md5} />
          )}
          <DetailRow label={t('files.infoModal.labels.group')} value={fileInfo.group.name} />
          <DetailRow label={t('files.infoModal.labels.groupId')} value={fileInfo.group.id} />
          <DetailRow
            label={t('files.infoModal.labels.groupOwner')}
            value={fileInfo.group.owner.name || fileInfo.group.owner.email}
          />
          {fileInfo.group.access && (
            <DetailRow
              label={t('files.infoModal.labels.groupAccess')}
              value={t(`files.infoModal.access.${fileInfo.group.access}`)}
            />
          )}
          <DetailRow label={t('files.infoModal.labels.server')} value={server.label} />
          <DetailRow label={t('files.infoModal.labels.serverAddress')} value={server.baseUrl} />
        </ScrollView>
      )}
    </DialogContent>
  );
};
