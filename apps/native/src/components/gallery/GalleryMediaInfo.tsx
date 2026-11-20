import { useServerContext } from '@/providers/ServerProvider';
import { fileSize } from '@/utils/common';
import { type MediaFileInfoResponse } from '@repo/shared';
import { Button, Icon, Text, theme, useThemeColors } from '@repo/shared/components';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components/native';

const Overlay = styled.View`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 30;
  align-items: center;
  justify-content: center;
  padding: ${theme.spacing[400]};
  background-color: ${theme.colors.overlay};
`;

const Backdrop = styled.Pressable`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
`;

const Panel = styled.View`
  width: 100%;
  max-width: 512px;
  max-height: 90%;
  gap: ${theme.spacing[300]};
  padding: ${theme.spacing[400]};
  border-radius: ${theme.radius[200]};
  border-width: ${theme.borderWeight[25]};
  border-color: ${theme.colors.border.default};
  background-color: ${theme.colors.surface.default};
`;

const PanelHeader = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

const Files = styled.View`
  gap: ${theme.spacing[200]};
`;

const FileOption = styled.Pressable<{ $selected: boolean }>`
  flex-direction: row;
  align-items: center;
  gap: ${theme.spacing[200]};
  padding: ${theme.spacing[200]} ${theme.spacing[300]};
  border-radius: ${theme.radius[150]};
  border-width: ${theme.borderWeight[25]};
  border-color: ${({ $selected }) => ($selected ? theme.colors.border.primary.default : theme.colors.border.default)};
  background-color: ${({ $selected }) => ($selected ? theme.colors.surface.stronger : 'transparent')};
`;

const DetailsScroll = styled.ScrollView`
  flex-shrink: 1;
`;

const Details = styled.View`
  gap: ${theme.spacing[300]};
  padding-right: ${theme.spacing[200]};
`;

const Detail = styled.View`
  gap: ${theme.spacing[100]};
  padding-bottom: ${theme.spacing[300]};
  border-bottom-width: ${theme.borderWeight[25]};
  border-bottom-color: ${theme.colors.border.default};
`;

type GalleryMediaInfoProps = {
  serverId: string;
  mediaId: string;
  onClose: () => void;
};

type DetailRowProps = {
  label: string;
  value: string;
};

const DetailRow = ({ label, value }: DetailRowProps) => (
  <Detail>
    <Text.S color={theme.colors.text.secondary}>{label}</Text.S>
    <Text selectable>{value}</Text>
  </Detail>
);

const formatExposureTime = (seconds: number) => (seconds < 1 ? `1/${Math.round(1 / seconds)} s` : `${seconds} s`);

export function GalleryMediaInfo({ serverId, mediaId, onClose }: GalleryMediaInfoProps) {
  const { t, i18n } = useTranslation();
  const colors = useThemeColors();
  const { allServers } = useServerContext();
  const server = allServers.find((item) => item.id === serverId);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  const {
    data: info,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['media-info', serverId, mediaId],
    queryFn: () => server!.client.photo.info(mediaId),
    enabled: Boolean(server),
  });

  const files = info?.files ?? [];
  const selectedFile: MediaFileInfoResponse | undefined = files.find((file) => file.id === selectedFileId) ?? files[0];
  const formatDate = (value: Date | string) => new Date(value).toLocaleString(i18n.language);

  const rows: DetailRowProps[] = [];
  if (info && selectedFile) {
    rows.push(
      { label: t('gallery.info.labels.name'), value: selectedFile.originalName },
      {
        label: t('gallery.info.labels.type'),
        value: selectedFile.mimeType ?? (selectedFile.extension.slice(1).toUpperCase() || '-'),
      },
      { label: t('gallery.info.labels.size'), value: fileSize(selectedFile.size) },
      {
        label: t('gallery.info.labels.preview'),
        value: selectedFile.displayable ? t('gallery.info.yes') : t('gallery.info.no'),
      },
      { label: t('gallery.info.labels.added'), value: formatDate(selectedFile.createdAt) }
    );

    if (selectedFile.width && selectedFile.height) {
      rows.push({
        label: t('gallery.info.labels.dimensions'),
        value: `${selectedFile.width} × ${selectedFile.height}`,
      });
    }
    if (selectedFile.camera) {
      rows.push({ label: t('gallery.info.labels.camera'), value: selectedFile.camera });
    }
    if (selectedFile.lens) {
      rows.push({ label: t('gallery.info.labels.lens'), value: selectedFile.lens });
    }
    if (selectedFile.iso !== undefined) {
      rows.push({ label: t('gallery.info.labels.iso'), value: String(selectedFile.iso) });
    }
    if (selectedFile.aperture !== undefined) {
      rows.push({ label: t('gallery.info.labels.aperture'), value: `f/${selectedFile.aperture}` });
    }
    if (selectedFile.exposureTime !== undefined) {
      rows.push({ label: t('gallery.info.labels.exposureTime'), value: formatExposureTime(selectedFile.exposureTime) });
    }
    if (selectedFile.focalLength !== undefined) {
      rows.push({ label: t('gallery.info.labels.focalLength'), value: `${selectedFile.focalLength} mm` });
    }
    if (selectedFile.latitude !== undefined && selectedFile.longitude !== undefined) {
      rows.push({
        label: t('gallery.info.labels.location'),
        value: `${selectedFile.latitude.toFixed(5)}, ${selectedFile.longitude.toFixed(5)}`,
      });
    }

    rows.push(
      { label: t('gallery.info.labels.path'), value: selectedFile.path },
      { label: t('gallery.info.labels.checksum'), value: selectedFile.hash }
    );

    if (info.capturedAt) {
      rows.push({ label: t('gallery.info.labels.captured'), value: formatDate(info.capturedAt) });
    }
    if (info.deletedAt) {
      rows.push({ label: t('gallery.info.labels.status'), value: t('gallery.info.inTrash') });
    }
  }

  return (
    <Overlay>
      <Backdrop onPress={onClose} accessibilityRole="button" />

      <Panel>
        <PanelHeader>
          <Text.H3>{t('gallery.info.title')}</Text.H3>
          <Button variant="tertiary" size="small" onPress={onClose} accessibilityLabel={t('gallery.lightbox.close')}>
            <Icon.X size={18} color={colors.text.default} aria-hidden />
          </Button>
        </PanelHeader>

        {isLoading && <Text color={theme.colors.text.secondary}>{t('gallery.info.loading')}</Text>}
        {(isError || !server) && <Text color={theme.colors.text.danger}>{t('gallery.info.unavailable')}</Text>}

        {files.length > 1 && (
          <Files>
            <Text.S color={theme.colors.text.secondary}>{t('gallery.info.files')}</Text.S>
            {files.map((file) => (
              <FileOption
                key={file.id}
                onPress={() => setSelectedFileId(file.id)}
                $selected={file.id === selectedFile?.id}
              >
                <Text style={{ flex: 1 }} numberOfLines={1}>
                  {file.originalName}
                </Text>
                {file.isMain ? (
                  <Text.Caption color={theme.colors.text.secondary}>{t('gallery.info.main')}</Text.Caption>
                ) : null}
                <Text.Caption color={theme.colors.text.secondary}>{fileSize(file.size)}</Text.Caption>
              </FileOption>
            ))}
          </Files>
        )}

        {rows.length > 0 && (
          <DetailsScroll>
            <Details>
              {rows.map((row) => (
                <DetailRow key={row.label} label={row.label} value={row.value} />
              ))}
            </Details>
          </DetailsScroll>
        )}
      </Panel>
    </Overlay>
  );
}
