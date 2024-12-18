import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Text } from '@repo/ui';
import { useQuery } from '@tanstack/react-query';
import { Api } from '@/api/api';

export default function ViewPage() {
  const { t } = useTranslation();
  const { fileUri } = useLocalSearchParams<{ fileUri?: string }>();

  const { data } = useQuery({
    queryKey: ['download', fileUri],
    queryFn: async () => {
      if (!fileUri) return;
      const r = await Api.files.filesControllerDownload({ fileUri });
      const s = await r.text();
      return s;
    },
  });

  console.log(data);

  return (
    <View className="flex-1 bg-layer relative">
      <View className="flex-1 bg-layer">
        <Text>{data}</Text>
      </View>
    </View>
  );
}
