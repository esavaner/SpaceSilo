import { useServerContext } from '@/providers/ServerProvider';
import { fileSize } from '@/utils/common';
import { type MediaFileInfoResponse } from '@repo/shared';
import { Button, Text, theme, useThemeColors } from '@repo/shared/components';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';

type GalleryMediaInfoProps = {
  serverId: string;
  mediaId: string;
  onClose: () => void;
};

type DetailRowProps = {
  label: string;
  value: string;
};

const DetailRow = ({ label, value, borderColor }: DetailRowProps & { borderColor: string }) => (
  <View className="gap-1 border-b pb-3" style={{ borderColor }}>
    <Text.S color={theme.colors.text.secondary}>{label}</Text.S>
    <Text selectable>{value}</Text>
  </View>
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
    <View className="absolute inset-0 z-30 items-center justify-center p-4" style={{ backgroundColor: colors.overlay }}>
      <Pressable className="absolute inset-0" onPress={onClose} accessibilityRole="button" />

      <View
        className="w-full max-w-lg gap-3 rounded-lg border p-4"
        style={{ maxHeight: '90%', backgroundColor: colors.surface.default, borderColor: colors.border.default }}
      >
        <View className="flex-row items-center justify-between">
          <Text.H3>{t('gallery.info.title')}</Text.H3>
          <Button variant="tertiary" size="small" onPress={onClose} accessibilityLabel={t('gallery.lightbox.close')}>
            <X size={18} color={colors.text.default} aria-hidden />
          </Button>
        </View>

        {isLoading && <Text color={theme.colors.text.secondary}>{t('gallery.info.loading')}</Text>}
        {(isError || !server) && <Text color={theme.colors.text.danger}>{t('gallery.info.unavailable')}</Text>}

        {files.length > 1 && (
          <View className="gap-2">
            <Text.S color={theme.colors.text.secondary}>{t('gallery.info.files')}</Text.S>
            {files.map((file) => (
              <Pressable
                key={file.id}
                onPress={() => setSelectedFileId(file.id)}
                className="flex-row items-center gap-2 rounded-md border px-3 py-2"
                style={
                  file.id === selectedFile?.id
                    ? { borderColor: colors.border.primary.default, backgroundColor: colors.surface.stronger }
                    : { borderColor: colors.border.default }
                }
              >
                <Text style={{ flex: 1 }} numberOfLines={1}>
                  {file.originalName}
                </Text>
                {file.isMain ? (
                  <Text.Caption color={theme.colors.text.secondary}>{t('gallery.info.main')}</Text.Caption>
                ) : null}
                <Text.Caption color={theme.colors.text.secondary}>{fileSize(file.size)}</Text.Caption>
              </Pressable>
            ))}
          </View>
        )}

        {rows.length > 0 && (
          <ScrollView style={{ flexShrink: 1 }} contentContainerClassName="gap-3 pr-2">
            {rows.map((row) => (
              <DetailRow key={row.label} label={row.label} value={row.value} borderColor={colors.border.default} />
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
}
