import { useRootNavigationState } from 'expo-router';
import { Text } from '@/components/general/text';
import { BaseLayout } from '@/components/base-layout';
import { useTranslation } from 'react-i18next';

export default function IndexPage() {
  const { t } = useTranslation();
  const rootNavigationState = useRootNavigationState();

  if (!rootNavigationState?.key) return null;

  return (
    <BaseLayout>
      <Text variant="h1">{t('navigation.dashboard')}</Text>
    </BaseLayout>
  );
}
