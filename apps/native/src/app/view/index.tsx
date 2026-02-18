import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { Text } from '@/components/text';
import { useQuery } from '@tanstack/react-query';

import { Image } from 'expo-image';
import { FileType, getFileType } from '@/utils/files';

export default function ViewPage() {
  const { t } = useTranslation();
  const { groupId, fileUri } = useLocalSearchParams<{ groupId: string; fileUri: string }>();

  // const { data: file } = useQuery({
  //   queryKey: ['file', groupId, fileUri],
  //   queryFn: async () => {
  //     if (!fileUri || !groupId) return;
  //     const r = await Api.files.filesControllerFind({ fileUri, groupId });
  //     return r.data;
  //   },
  // });

  // const fileType = getFileType(file?.type);

  // const { data: fileData } = useQuery({
  //   queryKey: ['download', groupId, fileUri],
  //   queryFn: async () => {
  //     if (!fileUri) return;
  //     const r = await Api.files.filesControllerDownload({ fileUri, groupId });
  //     const s = await r.text();
  //     return s;
  //     // if (!fileUri) return;
  //     // const r = await Api.files.filesControllerDownload({ fileUri });
  //     // const arrayBuffer = await r.arrayBuffer();
  //     // const base64String = Buffer.from(arrayBuffer).toString('base64');
  //     // return `data:image/jpeg;base64,${base64String}`;
  //   },
  //   enabled: fileType !== FileType.IMAGE,
  // });

  const fileType = getFileType('application/pdf'); // TODO: replace with actual file type
  const fileData =
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'; // TODO: replace with actual file data

  return (
    <View className="flex-1 bg-background relative">
      <View className="flex-1 bg-layer-secondary items-center justify-center">
        {fileType === FileType.IMAGE ? (
          <Image
            source={`http://192.168.0.176:3100/files/download?groupId=${groupId}&fileUri=${fileUri}`}
            className="flex-1 w-[80vw] max-h-[90vh]"
            contentFit="contain"
          />
        ) : (
          <ScrollView className="p-4 h-full w-full items-center">
            <View className="p-4 bg-background w-full max-w-lg min-h-[80vh] rounded-lg">
              <Text>{fileData}</Text>
            </View>
          </ScrollView>
        )}
      </View>
    </View>
  );
}
