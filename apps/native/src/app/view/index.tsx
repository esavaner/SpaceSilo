import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Text } from '@repo/ui';
import { useQuery } from '@tanstack/react-query';
import { Api } from '@/api/api';
import { Image } from 'expo-image';
import { FileType, fileTypes } from '@/utils/files';

export default function ViewPage() {
  const { t } = useTranslation();
  const { groupId, fileUri } = useLocalSearchParams<{ groupId: string; fileUri: string }>();

  const { data: file } = useQuery({
    queryKey: ['file', groupId, fileUri],
    queryFn: async () => {
      if (!fileUri || !groupId) return;
      const r = await Api.files.filesControllerFind({ fileUri, groupId });
      return r.data;
    },
  });

  const fileType = Object.entries(fileTypes).find(([key, value]) => file?.type && value.includes(file?.type))?.[0];

  const { data: fileData } = useQuery({
    queryKey: ['download', groupId, fileUri],
    queryFn: async () => {
      if (!fileUri) return;
      const r = await Api.files.filesControllerDownload({ fileUri, groupId });
      const s = await r.text();
      return s;
      // if (!fileUri) return;
      // const r = await Api.files.filesControllerDownload({ fileUri });
      // const arrayBuffer = await r.arrayBuffer();
      // const base64String = Buffer.from(arrayBuffer).toString('base64');
      // return `data:image/jpeg;base64,${base64String}`;
    },
    enabled: fileType !== FileType.IMAGE,
  });

  return (
    <View className="flex-1 bg-layer relative">
      <View className="flex-1 bg-layer">
        {fileType === FileType.IMAGE ? (
          <Image
            source={`http://192.168.0.176:3100/files/download?groupId=${groupId}&fileUri=${fileUri}`}
            className="flex-1 max-w-[90vh] max-h-[90vh]"
            contentFit="contain"
          />
        ) : (
          <Text>{fileData}</Text>
        )}
      </View>
    </View>
  );
}
