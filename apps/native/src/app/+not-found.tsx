import { Text } from '@/components/general/text';
import { Link, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

export default function NotFoundScreen() {
  const { t } = useTranslation();
  return (
    <>
      <Stack.Screen options={{ title: t('Err.NotFound.title') }} />
      <View>
        <Text>{t('Err.NotFound.description')}</Text>
        <Link href="/files">
          <Text>{t('Err.NotFound.cta')}</Text>
        </Link>
      </View>
    </>
  );
}
