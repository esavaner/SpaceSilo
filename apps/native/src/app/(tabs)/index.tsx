import { useRootNavigationState } from 'expo-router';
import { Text } from '@/components/general/text';
import { BaseLayout } from '@/components/base-layout';
import { useTranslation } from 'react-i18next';
import { Button } from '@repo/shared/ui';
import { useState } from 'react';

export default function IndexPage() {
  const { t } = useTranslation();
  const rootNavigationState = useRootNavigationState();
  const [buttonCount, setButtonCount] = useState(0);

  if (!rootNavigationState?.key) return null;

  return (
    <BaseLayout>
      <Text variant="h1">{t('navigation.dashboard')}</Text>
      <Button onPress={() => setButtonCount((count) => count + 1)}>Shared styled button</Button>
      <Button disabled onPress={() => setButtonCount((count) => count + 1)}>
        Disabled
      </Button>
      <Text>Button pressed {buttonCount} times</Text>
    </BaseLayout>
  );
}
