import { useRootNavigationState } from 'expo-router';
import { Text } from '@/components/general/text';
import { BaseLayout } from '@/components/base-layout';
import { useTranslation } from 'react-i18next';
import { Text as SharedText } from '@repo/shared/components/text';

export default function IndexPage() {
  const { t } = useTranslation();
  const rootNavigationState = useRootNavigationState();

  if (!rootNavigationState?.key) return null;

  return (
    <BaseLayout>
      <Text variant="h1">{t('navigation.dashboard')}</Text>
      <SharedText.H1>{t('sharedText.heading')}</SharedText.H1>
      <SharedText.M>{t('sharedText.body')}</SharedText.M>
      <SharedText.S center italic weight={700} color="#307467">
        {t('sharedText.styled')}
      </SharedText.S>
      <SharedText.M em="primary">{t('sharedText.emphasis')}</SharedText.M>
      <SharedText.M em="underline">{t('sharedText.underline')}</SharedText.M>
      <SharedText.M em="circle">{t('sharedText.circle')}</SharedText.M>
      <SharedText.M em="divider">{t('sharedText.divider')}</SharedText.M>
    </BaseLayout>
  );
}
