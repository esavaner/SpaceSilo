import { BaseLayout } from '@/components/base-layout';
import { ServerLogo } from '@/components/general/server-logo';
import { ServerType } from '@/api/_client';
import { endpoints } from '@/api/core.client';
import { useValidators } from '@/hooks/useValidators';
import { toast } from '@/lib/toast';
import { ServerConnectionWithClient, useServerContext } from '@/providers/ServerProvider';
import { yupResolver } from '@hookform/resolvers/yup';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { tApiErr } from '@/i18n/translate';
import { Controller, useForm } from 'react-hook-form';
import styled from 'styled-components/native';
import { Button, Input, Text, theme } from '@repo/shared/components';
import * as yup from 'yup';

const providerMeta = {
  coreNas: {
    titleKey: 'connections.providers.coreNas.title',
    descriptionKey: 'connections.providers.coreNas.desc',
    icon: <ServerLogo.Core size={30} />,
  },
  googleDrive: {
    titleKey: 'connections.providers.googleDrive.title',
    descriptionKey: 'connections.providers.googleDrive.desc',
    icon: <ServerLogo.GoogleDrive size={30} />,
  },
  dropbox: {
    titleKey: 'connections.providers.dropbox.title',
    descriptionKey: 'connections.providers.dropbox.desc',
    icon: <ServerLogo.Dropbox size={30} />,
  },
} as const;

type Provider = keyof typeof providerMeta;
type CoreNasForm = {
  displayName: string;
  serverUrl: string;
  email: string;
  password: string;
};

const PageContent = styled.View`
  gap: ${theme.spacing[300]};
`;

const Subtitle = styled(Text.M)`
  margin-top: ${theme.spacing[200]};
  color: ${theme.colors.text.secondary};
`;

const AddPanel = styled.View`
  margin: ${theme.spacing[400]} 0;
  padding: ${theme.spacing[400]};
  border: ${theme.borderWeight[50]} dashed ${theme.colors.border.default};
  border-radius: ${theme.radius[200]};
`;

const PanelContent = styled.View`
  gap: ${theme.spacing[100]};
`;

const ProvidersGrid = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: ${theme.spacing[300]};
  margin-top: ${theme.spacing[400]};
`;

const ProviderCard = styled.Pressable`
  flex: 1;
  min-width: 240px;
  flex-direction: row;
  gap: ${theme.spacing[400]};
  padding: ${theme.spacing[400]};
  border: ${theme.borderWeight[25]} solid ${theme.colors.border.default};
  border-radius: ${theme.radius[300]};
  cursor: pointer;
  &:hover {
    background-color: ${theme.colors.surface.medium};
  }
`;

const ProviderIcon = styled.View`
  margin-top: ${theme.spacing[100]};
`;

const ProviderDetails = styled.View`
  flex: 1;
  gap: ${theme.spacing[50]};
`;

const ProviderConfig = styled.View`
  gap: ${theme.spacing[300]};
  margin-top: ${theme.spacing[400]};
`;

const FormActions = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: ${theme.spacing[300]};
  margin-top: ${theme.spacing[200]};
`;

const ExistingHeading = styled(Text.H2)`
  margin-bottom: ${theme.spacing[300]};
`;

const ExistingGrid = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: ${theme.spacing[300]};
`;

const ServerCard = styled.View`
  flex: 1;
  min-width: 240px;
  gap: ${theme.spacing[200]};
  padding: ${theme.spacing[400]};
  border: ${theme.borderWeight[25]} solid ${theme.colors.border.default};
  border-radius: ${theme.radius[200]};
`;

const ServerActions = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: ${theme.spacing[200]};
`;

const EmptyState = styled(Text.S)`
  align-self: center;
  margin-top: ${theme.spacing[800]};
  color: ${theme.colors.text.secondary};
`;

export default function ConnectionsPage() {
  const { t } = useTranslation();
  const validators = useValidators();
  const { allServers, loginAndSaveServer, removeServer, setServerEnabled } = useServerContext();
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [isSavingCoreNas, setIsSavingCoreNas] = useState(false);
  const [busyServerId, setBusyServerId] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CoreNasForm>({
    resolver: yupResolver(
      yup.object({
        displayName: validators.displayName,
        serverUrl: validators.serverUrl,
        email: validators.email,
        password: validators.password,
      })
    ),
    defaultValues: {
      displayName: '',
      serverUrl: '',
      email: '',
      password: '',
    },
  });

  const onConnectCoreNas = async (values: CoreNasForm) => {
    let savedServer: ServerConnectionWithClient | undefined;
    setIsSavingCoreNas(true);
    try {
      savedServer = await loginAndSaveServer({
        type: ServerType.CORE,
        baseUrl: values.serverUrl,
        email: values.email,
        password: values.password,
        label: values.displayName,
      });

      await savedServer.client.get(endpoints.users);
      toast.success(
        t('connections.messages.connected', {
          provider: t('connections.providers.coreNas.title'),
          name: savedServer.label,
        })
      );
      reset();
      setSelectedProvider(null);
    } catch (error) {
      if (savedServer) {
        await removeServer(savedServer.id);
      }
      toast.error(tApiErr(t, error, 'connections.messages.failed'));
    } finally {
      setIsSavingCoreNas(false);
    }
  };

  const onRemoveCoreServer = async (serverId: string) => {
    setBusyServerId(serverId);
    try {
      await removeServer(serverId);
      toast.info(t('connections.messages.removed'));
    } finally {
      setBusyServerId(null);
    }
  };

  const onToggleCoreServer = async (serverId: string, enabled: boolean) => {
    setBusyServerId(serverId);
    try {
      await setServerEnabled(serverId, enabled);
    } finally {
      setBusyServerId(null);
    }
  };

  const providerConfig = selectedProvider ? (
    selectedProvider === 'coreNas' ? (
      <ProviderConfig>
        <Controller
          control={control}
          name="displayName"
          render={({ field }) => (
            <Input
              label={t('inputs.displayName')}
              placeholder={t('placeholders.displayName')}
              value={field.value}
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              error={errors.displayName?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="serverUrl"
          render={({ field }) => (
            <Input
              label={t('inputs.serverUrl')}
              placeholder={t('placeholders.serverUrl')}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              value={field.value}
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              error={errors.serverUrl?.message}
            />
          )}
        />
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
        <FormActions>
          <Button variant="secondary" onPress={() => setSelectedProvider(null)}>
            {t('connections.actions.chooseOther')}
          </Button>
          <Button onPress={handleSubmit(onConnectCoreNas)} loading={isSavingCoreNas}>
            {t('connections.actions.addCoreNas')}
          </Button>
        </FormActions>
      </ProviderConfig>
    ) : (
      <ProviderConfig>
        <Text.S color={theme.colors.text.secondary}>
          {t('connections.oauth', {
            provider: t(providerMeta[selectedProvider].titleKey),
          })}
        </Text.S>
        <Button onPress={() => null}>
          {t('connections.actions.connectWith', {
            provider: t(providerMeta[selectedProvider].titleKey),
          })}
        </Button>
      </ProviderConfig>
    )
  ) : null;

  return (
    <BaseLayout
      header={
        <>
          <Text.H1>{t('connections.title')}</Text.H1>
          <Subtitle>{t('connections.subtitle')}</Subtitle>
        </>
      }
    >
      <PageContent>
        <AddPanel>
          <PanelContent>
            <Text.H2>{t('connections.add')}</Text.H2>
            <Text.S color={theme.colors.text.secondary}>
              {selectedProvider
                ? t('connections.setup', {
                    provider: t(providerMeta[selectedProvider].titleKey),
                  })
                : t('connections.select')}
            </Text.S>
          </PanelContent>

          {!selectedProvider ? (
            <ProvidersGrid>
              {Object.entries(providerMeta).map(([provider, meta]) => (
                <ProviderCard
                  key={provider}
                  onPress={() => setSelectedProvider(provider as Provider)}
                  accessibilityRole="button"
                >
                  <ProviderIcon>{meta.icon}</ProviderIcon>
                  <ProviderDetails>
                    <Text.H3>{t(meta.titleKey)}</Text.H3>
                    <Text.S color={theme.colors.text.secondary}>{t(meta.descriptionKey)}</Text.S>
                  </ProviderDetails>
                </ProviderCard>
              ))}
            </ProvidersGrid>
          ) : (
            providerConfig
          )}
        </AddPanel>
        <ExistingHeading>{t('connections.existing')}</ExistingHeading>
        {allServers.length === 0 ? (
          <EmptyState>{t('connections.messages.none')}</EmptyState>
        ) : (
          <ExistingGrid>
            {allServers.map((server) => (
              <ServerCard key={server.id}>
                <Text.H3>{server.label}</Text.H3>
                <Text.S color={theme.colors.text.secondary}>{server.baseUrl}</Text.S>
                <Text.S>
                  {server.disabled ? t('connections.status.disabled') : t('connections.status.enabled')}
                </Text.S>
                <ServerActions>
                  <Button
                    variant="secondary"
                    onPress={() =>
                      router.push({ pathname: '/connections/[serverId]', params: { serverId: server.id } })
                    }
                  >
                    {t('common.actions.details')}
                  </Button>
                  <Button
                    variant="secondary"
                    onPress={() => onToggleCoreServer(server.id, server.disabled)}
                    loading={busyServerId === server.id}
                  >
                    {server.disabled ? t('connections.actions.enable') : t('connections.actions.disable')}
                  </Button>
                  <Button
                    variant="destructive"
                    onPress={() => onRemoveCoreServer(server.id)}
                    loading={busyServerId === server.id}
                  >
                    {t('connections.actions.remove')}
                  </Button>
                </ServerActions>
              </ServerCard>
            ))}
          </ExistingGrid>
        )}
      </PageContent>
    </BaseLayout>
  );
}
