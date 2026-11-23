import { type GalleryScanResponse, type GalleryStatsResponse } from '@repo/shared';
import { Button, Input, Text, theme } from '@repo/shared/components';
import { ApiError } from '@/api/_client';
import { BaseLayout } from '@/components/base-layout';
import { serverIcons } from '@/constants/server-icons';
import { useValidators } from '@/hooks/useValidators';
import { toast } from '@repo/shared/toast';
import { useServerContext } from '@/providers/ServerProvider';
import { fileSize } from '@/utils/common';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Platform } from 'react-native';
import styled from 'styled-components/native';
import { tApiErr } from '@/i18n/translate';
import * as yup from 'yup';

type LoginForm = { email: string; password: string };

const Header = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${theme.spacing[400]};
`;

const ServerInfo = styled.View`
  flex: 1;
  min-width: 160px;
  flex-direction: row;
  align-items: center;
  gap: ${theme.spacing[400]};
`;

const ServerIcon = styled.View`
  margin-top: ${theme.spacing[100]};
`;

const ServerDetails = styled.View`
  flex: 1;
  gap: ${theme.spacing[100]};
`;

const NotFoundMessage = styled(Text.S)`
  color: ${theme.colors.text.secondary};
`;

const UnavailableMessage = styled(Text.S)`
  color: ${theme.colors.text.secondary};
`;

const StatsGrid = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: ${theme.spacing[300]};
`;

const StatCardContainer = styled.View`
  flex: 1;
  min-width: 160px;
  gap: ${theme.spacing[100]};
  padding: ${theme.spacing[400]};
  border: ${theme.borderWeight[25]} solid ${theme.colors.border.default};
  border-radius: ${theme.radius[200]};
  background-color: ${theme.colors.surface.medium};
`;

const StatCard = ({ label, value }: { label: string; value: string }) => (
  <StatCardContainer>
    <Text.S color={theme.colors.text.secondary}>{label}</Text.S>
    <Text.H3>{value}</Text.H3>
  </StatCardContainer>
);

const ActionsPanel = styled.View`
  gap: ${theme.spacing[200]};
  padding: ${theme.spacing[400]};
  border: ${theme.borderWeight[25]} solid ${theme.colors.border.default};
  border-radius: ${theme.radius[200]};
`;

const ActionButtons = styled.View`
  align-items: flex-start;
  gap: ${theme.spacing[200]};
  margin-top: ${theme.spacing[200]};
`;

export default function ConnectionDetailsPage() {
  const { t } = useTranslation();
  const validators = useValidators();
  const queryClient = useQueryClient();
  const { serverId } = useLocalSearchParams<{ serverId: string }>();
  const { allServers, loginAndSaveServer } = useServerContext();

  const server = allServers.find((item) => item.id === serverId);
  const canQuery = !!server && !server.disabled && server.client.status === 'logged_in';
  const authErrorMessage = (error: unknown, fallback: string) =>
    error instanceof ApiError ? tApiErr(t, error, fallback) : t(fallback);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: yupResolver(yup.object({ email: validators.email, password: validators.password })),
    defaultValues: { email: server?.client.account?.email ?? '', password: '' },
  });

  const { data: stats, isPending } = useQuery({
    queryKey: ['server-gallery-stats', serverId],
    queryFn: () => server!.client.gallery.getStats(),
    enabled: canQuery,
  });

  const { mutate: triggerScan, isPending: isScanning } = useMutation({
    mutationKey: ['server-gallery-scan', serverId],
    mutationFn: (shouldReset: boolean) =>
      shouldReset ? server!.client.gallery.resetAndScan() : server!.client.gallery.scan(),
    onSuccess: (result: GalleryScanResponse, shouldReset) => {
      toast.success(
        t(
          shouldReset ? 'connections.details.messages.resetAndScanSuccess' : 'connections.details.messages.scanSuccess',
          { scanned: result.scannedImages, added: result.addedImages }
        )
      );
      queryClient.invalidateQueries({ queryKey: ['server-gallery-stats', serverId] });
      queryClient.invalidateQueries({ queryKey: ['gallery'] });
    },
    onError: (error, shouldReset) => {
      toast.error(
        tApiErr(
          t,
          error,
          shouldReset ? 'connections.details.messages.resetAndScanFailed' : 'connections.details.messages.scanFailed'
        )
      );
    },
  });

  const { mutate: logout, isPending: isLoggingOut } = useMutation({
    mutationFn: () => server!.client.logout(),
    onSuccess: () => toast.success(t('connections.details.session.loggedOut')),
    onError: (error) => toast.error(authErrorMessage(error, 'connections.details.session.logoutFailed')),
  });

  const { mutate: retryConnection, isPending: isReconnecting } = useMutation({
    mutationFn: async () => {
      if (!(await server!.client.reconnect())) {
        throw server!.client.loginError ?? new Error(t('connections.details.session.reconnectFailed'));
      }
    },
    onSuccess: () => toast.success(t('connections.details.session.reconnected')),
    onError: (error) => toast.error(authErrorMessage(error, 'connections.details.session.reconnectFailed')),
  });

  const { mutate: login, isPending: isLoggingIn } = useMutation({
    mutationFn: (values: LoginForm) =>
      loginAndSaveServer({
        type: server!.type,
        baseUrl: server!.baseUrl,
        label: server!.label,
        email: values.email,
        password: values.password,
      }),
    onSuccess: (_, values) => {
      reset({ email: values.email, password: '' });
      toast.success(t('connections.details.session.reconnected'));
    },
    onError: (error) => toast.error(authErrorMessage(error, 'connections.details.session.loginFailed')),
  });

  const confirmResetAndScan = () => {
    const title = t('connections.details.messages.resetAndScanTitle');
    const message = t('connections.details.messages.resetAndScanDescription');

    if (Platform.OS === 'web') {
      if (typeof window === 'undefined' || window.confirm(message)) {
        triggerScan(true);
      }
      return;
    }

    Alert.alert(title, message, [
      { text: t('common.actions.cancel'), style: 'cancel' },
      { text: t('common.actions.continue'), style: 'destructive', onPress: () => triggerScan(true) },
    ]);
  };

  if (!server) {
    return (
      <BaseLayout header={<Text.H1>{t('navigation.connection')}</Text.H1>}>
        <NotFoundMessage>{t('connections.details.messages.Err.NotFound')}</NotFoundMessage>
      </BaseLayout>
    );
  }

  const statValues: GalleryStatsResponse = stats ?? {
    totalFiles: 0,
    totalImages: 0,
    indexedImages: 0,
    storageSize: 0,
  };

  return (
    <BaseLayout
      header={
        <Header>
          <ServerInfo>
            <ServerIcon>{serverIcons[server.type]}</ServerIcon>
            <ServerDetails>
              <Text.H1>{server.label}</Text.H1>
              <Text.S color={theme.colors.text.secondary}>{server.baseUrl}</Text.S>
              <Text.S>
                {server.disabled
                  ? t('connections.details.state.disabled')
                  : server.client.status === 'logged_in'
                    ? t('connections.details.state.connected')
                    : t('connections.details.state.disconnected')}
              </Text.S>
              {server.client.account?.email && (
                <Text.S color={theme.colors.text.secondary}>{server.client.account.email}</Text.S>
              )}
            </ServerDetails>
          </ServerInfo>
          <Button onPress={() => triggerScan(false)} loading={isScanning} disabled={!canQuery}>
            {t('connections.details.actions.scanImages')}
          </Button>
        </Header>
      }
    >
      {!canQuery && <UnavailableMessage>{t('connections.details.messages.statsUnavailable')}</UnavailableMessage>}

      <StatsGrid>
        <StatCard
          label={t('connections.details.stats.storedFiles')}
          value={isPending ? '...' : String(statValues.totalFiles)}
        />
        <StatCard
          label={t('connections.details.stats.imageFiles')}
          value={isPending ? '...' : String(statValues.totalImages)}
        />
        <StatCard
          label={t('connections.details.stats.indexedImages')}
          value={isPending ? '...' : String(statValues.indexedImages)}
        />
        <StatCard
          label={t('connections.details.stats.storageSize')}
          value={isPending ? '...' : fileSize(statValues.storageSize)}
        />
      </StatsGrid>

      <ActionsPanel>
        <Text.H3>{t('common.labels.actions')}</Text.H3>
        <Text.S color={theme.colors.text.secondary}>{t('connections.details.actionDescription')}</Text.S>
        <ActionButtons>
          <Button onPress={() => triggerScan(false)} loading={isScanning} disabled={!canQuery}>
            {t('connections.details.actions.scanAndIndex')}
          </Button>
          <Button onPress={confirmResetAndScan} loading={isScanning} disabled={!canQuery} variant="destructive">
            {t('connections.details.actions.resetAndScan')}
          </Button>
        </ActionButtons>
      </ActionsPanel>

      <ActionsPanel>
        <Text.H3>{t('connections.details.session.title')}</Text.H3>
        {server.client.status === 'logged_in' ? (
          <ActionButtons>
            <Button variant="destructive" onPress={() => logout()} loading={isLoggingOut}>
              {t('connections.details.session.logout')}
            </Button>
          </ActionButtons>
        ) : (
          <>
            <Text.S color={theme.colors.text.secondary}>{t('connections.details.session.signInDescription')}</Text.S>
            {server.client.status === 'error' && (
              <ActionButtons>
                <Button variant="secondary" onPress={() => retryConnection()} loading={isReconnecting}>
                  {t('connections.details.session.retry')}
                </Button>
                <Button variant="destructive" onPress={() => logout()} loading={isLoggingOut}>
                  {t('connections.details.session.logout')}
                </Button>
              </ActionButtons>
            )}
            <Controller
              control={control}
              name="email"
              render={({ field }) => (
                <Input
                  label={t('inputs.email')}
                  placeholder={t('placeholders.email')}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  value={field.value}
                  onBlur={field.onBlur}
                  onChangeText={field.onChange}
                  error={errors.email?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="password"
              render={({ field }) => (
                <Input
                  label={t('inputs.password')}
                  placeholder={t('placeholders.password')}
                  secureTextEntry
                  value={field.value}
                  onBlur={field.onBlur}
                  onChangeText={field.onChange}
                  error={errors.password?.message}
                />
              )}
            />
            <ActionButtons>
              <Button onPress={handleSubmit((values) => login(values))} loading={isLoggingIn}>
                {t('connections.details.session.signIn')}
              </Button>
            </ActionButtons>
          </>
        )}
      </ActionsPanel>
    </BaseLayout>
  );
}
