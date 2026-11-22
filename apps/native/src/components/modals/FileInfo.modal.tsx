import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components/native';
import { fileSize } from '@/utils/common';
import { useServerContext } from '@/providers/ServerProvider';
import { Modal, ModalTitle, Text, theme } from '@repo/shared/components';
import { type FileListItem } from '@/hooks/useFileList';

type FileInfoModalProps = {
  file: FileListItem;
};

type DetailRowProps = {
  label: string;
  value: string;
};

const Detail = styled.View`
  gap: ${theme.spacing[100]};
  border-bottom-width: ${theme.borderWeight[25]};
  border-bottom-color: ${theme.colors.border.default};
  padding-bottom: ${theme.spacing[300]};
`;

const Details = styled.View`
  gap: ${theme.spacing[300]};
`;

const DetailRow = ({ label, value }: DetailRowProps) => (
  <Detail>
    <Text.S color={theme.colors.text.secondary}>{label}</Text.S>
    <Text selectable>{value}</Text>
  </Detail>
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
    <Modal closeLabel={t('common.actions.close')} accessibilityLabel={t('files.infoModal.title')}>
      <ModalTitle>{t('files.infoModal.title')}</ModalTitle>
      <Text.S color={theme.colors.text.secondary}>{file.name}</Text.S>
      {isLoading && <Text color={theme.colors.text.secondary}>{t('files.infoModal.loading')}</Text>}
      {(isError || !server) && <Text color={theme.colors.text.danger}>{t('files.infoModal.unavailable')}</Text>}
      {fileInfo && server && (
        <Details>
          <DetailRow label={t('files.infoModal.labels.name')} value={fileInfo.name} />
          <DetailRow label={t('files.infoModal.labels.type')} value={type} />
          {!fileInfo.isDirectory && (
            <DetailRow label={t('files.infoModal.labels.size')} value={fileSize(fileInfo.size ?? 0)} />
          )}
          <DetailRow label={t('files.infoModal.labels.modified')} value={formatDate(fileInfo.modificationTime)} />
          <DetailRow label={t('files.infoModal.labels.created')} value={formatDate(fileInfo.createdAt)} />
          <DetailRow label={t('files.infoModal.labels.path')} value={`/${fileInfo.uri}`} />
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
        </Details>
      )}
    </Modal>
  );
};
