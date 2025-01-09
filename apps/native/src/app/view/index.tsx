import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Text } from '@repo/ui';
import { useQuery } from '@tanstack/react-query';
import { Api } from '@/api/api';
import { Image } from 'expo-image';

export default function ViewPage() {
  const { t } = useTranslation();
  const { fileUri } = useLocalSearchParams<{ fileUri?: string }>();

  // const { data } = useQuery({
  //   queryKey: ['download', fileUri],
  //   queryFn: async () => {
  //     if (!fileUri) return;
  //     const r = await Api.files.filesControllerDownload({ fileUri });
  //     const s = await r.text();
  //     return s;

  //     if (!fileUri) return;
  //     const r = await Api.files.filesControllerDownload({ fileUri });
  //     const arrayBuffer = await r.arrayBuffer();
  //     const base64String = Buffer.from(arrayBuffer).toString('base64');
  //     return `data:image/jpeg;base64,${base64String}`;
  //   },
  // });

  return (
    <View className="flex-1 bg-layer relative">
      <View className="flex-1 bg-layer">
        {/* <Text>{data}</Text> */}
        <Image
          source={`http://localhost:3100/files/download?fileUri=${fileUri}`}
          className="flex-1 max-h-96 max-w-96"
        />
      </View>
    </View>
  );
}
