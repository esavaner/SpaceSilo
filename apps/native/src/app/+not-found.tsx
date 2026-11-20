import { Link, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components/native';
import { Button, Text, theme } from '@repo/shared/components';

const Page = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: ${theme.spacing[400]};
  padding: ${theme.spacing[400]};
  background-color: ${theme.colors.surface.default};
`;

export default function NotFoundScreen() {
  const { t } = useTranslation();
  return (
    <>
      <Stack.Screen options={{ title: t('Err.NotFound.title') }} />
      <Page>
        <Text center>{t('Err.NotFound.description')}</Text>
        <Link href="/files" asChild>
          <Button variant="link">{t('Err.NotFound.cta')}</Button>
        </Link>
      </Page>
    </>
  );
}
