import { ApiError } from '@/api/_client';
import { BaseLayout, BaseLayoutHeading } from '@/components/base-layout';
import { tApiErr } from '@/i18n/translate';
import { toast } from '@/lib/toast';
import { useServerContext, type ServerConnectionWithClient } from '@/providers/ServerProvider';
import { type SessionResponse } from '@repo/shared';
import { Button, Text, theme } from '@repo/shared/components';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Alert, Platform } from 'react-native';
import styled from 'styled-components/native';

const Panel = styled.View`
  gap: ${theme.spacing[300]};
  padding: ${theme.spacing[400]};
  border: ${theme.borderWeight[25]} solid ${theme.colors.border.default};
  border-radius: ${theme.radius[200]};
`;

const SessionCard = styled.View`
  gap: ${theme.spacing[100]};
  padding: ${theme.spacing[300]};
  border: ${theme.borderWeight[25]} solid ${theme.colors.border.default};
  border-radius: ${theme.radius[200]};
`;

const SessionActions = styled.View`
  align-items: flex-start;
  margin-top: ${theme.spacing[200]};
`;

function ServerSessions({ server }: { server: ServerConnectionWithClient }) {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const errorMessage = (error: unknown, fallback: string) =>
    error instanceof ApiError ? tApiErr(t, error, fallback) : t(fallback);
  const {
    data: sessions,
    isPending,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['sessions', server.id],
    queryFn: () => server.client.auth.listSessions(),
  });
  const {
    mutate: revoke,
    isPending: isRevoking,
    variables,
  } = useMutation({
    mutationFn: (session: SessionResponse) =>
      session.isCurrent ? server.client.logout() : server.client.auth.revokeSession(session.id),
    onSuccess: () => {
      toast.success(t('settings.account.sessions.revoked'));
      void queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
    onError: (mutationError) => toast.error(errorMessage(mutationError, 'settings.account.sessions.revokeFailed')),
  });

  const confirmRevoke = (session: SessionResponse) => {
    const title = t('settings.account.sessions.confirmTitle');
    const message = t(
      session.isCurrent ? 'settings.account.sessions.confirmCurrent' : 'settings.account.sessions.confirmOther'
    );
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(message)) revoke(session);
      return;
    }
    Alert.alert(title, message, [
      { text: t('common.actions.cancel'), style: 'cancel' },
      { text: t('settings.account.sessions.revoke'), style: 'destructive', onPress: () => revoke(session) },
    ]);
  };

  return (
    <Panel>
      <Text.H3>{server.label}</Text.H3>
      {server.client.account?.email && (
        <Text.S color={theme.colors.text.secondary}>{server.client.account.email}</Text.S>
      )}
      {isPending ? (
        <Text.S>{t('common.status.loading')}</Text.S>
      ) : isError ? (
        <>
          <Text.S>{errorMessage(error, 'settings.account.sessions.loadFailed')}</Text.S>
          <SessionActions>
            <Button variant="secondary" onPress={() => void refetch()}>
              {t('settings.account.sessions.retry')}
            </Button>
          </SessionActions>
        </>
      ) : sessions.length === 0 ? (
        <Text.S>{t('settings.account.sessions.empty')}</Text.S>
      ) : (
        sessions.map((session) => (
          <SessionCard key={session.id}>
            <Text.M>{session.deviceLabel || t('settings.account.sessions.unknownDevice')}</Text.M>
            {session.isCurrent && <Text.S>{t('settings.account.sessions.current')}</Text.S>}
            <Text.S color={theme.colors.text.secondary}>
              {t('settings.account.sessions.created', {
                date: new Date(session.createdAt).toLocaleString(i18n.language),
              })}
            </Text.S>
            <Text.S color={theme.colors.text.secondary}>
              {t('settings.account.sessions.lastUsed', {
                date: new Date(session.lastUsedAt).toLocaleString(i18n.language),
              })}
            </Text.S>
            <Text.S color={theme.colors.text.secondary}>
              {t('settings.account.sessions.expires', {
                date: new Date(session.expiresAt).toLocaleString(i18n.language),
              })}
            </Text.S>
            <SessionActions>
              <Button
                variant="destructive"
                onPress={() => confirmRevoke(session)}
                disabled={isRevoking}
                loading={isRevoking && variables?.id === session.id}
              >
                {t('settings.account.sessions.revoke')}
              </Button>
            </SessionActions>
          </SessionCard>
        ))
      )}
    </Panel>
  );
}

export default function SettingsPage() {
  const { t } = useTranslation();
  const { servers } = useServerContext();

  return (
    <BaseLayout
      header={
        <BaseLayoutHeading>
          <Text.H1>{t('settings.title')}</Text.H1>
        </BaseLayoutHeading>
      }
    >
      <Text.H2>{t('settings.account.title')}</Text.H2>
      <Text.H3>{t('settings.account.sessions.title')}</Text.H3>
      <Text.S color={theme.colors.text.secondary}>{t('settings.account.sessions.description')}</Text.S>
      {servers.length === 0 ? (
        <Text.S>{t('common.messages.noActiveServers')}</Text.S>
      ) : (
        servers.map((server) => <ServerSessions key={server.id} server={server} />)
      )}
    </BaseLayout>
  );
}
