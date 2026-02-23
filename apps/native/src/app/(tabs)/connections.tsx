import { BaseLayout } from '@/components/base-layout';
import { InputController } from '@/components/controllers/input.controller';
import { Button } from '@/components/general/button';
import { Icon } from '@/components/general/icon';
import { Text } from '@/components/general/text';
import { ServerType } from '@/api/_client';
import { endpoints } from '@/api/core.client';
import { useValidators } from '@/hooks/useValidators';
import { toast } from '@/lib/toast';
import { ServerConnectionWithClient, useServerContext } from '@/providers/ServerProvider';
import { yupResolver } from '@hookform/resolvers/yup';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { Pressable, View } from 'react-native';
import * as yup from 'yup';

const providerMeta = {
  coreNas: {
    titleKey: 'connections.providers.coreNas.title',
    descriptionKey: 'connections.providers.coreNas.desc',
    icon: <Icon.Core size={30} className="mt-1" />,
  },
  googleDrive: {
    titleKey: 'connections.providers.googleDrive.title',
    descriptionKey: 'connections.providers.googleDrive.desc',
    icon: <Icon.GoogleDrive size={30} className="mt-1" />,
  },
  dropbox: {
    titleKey: 'connections.providers.dropbox.title',
    descriptionKey: 'connections.providers.dropbox.desc',
    icon: <Icon.Dropbox size={30} className="mt-1" />,
  },
} as const;

type Provider = keyof typeof providerMeta;
type CoreNasForm = {
  displayName: string;
  serverUrl: string;
  email: string;
  password: string;
};

export default function ConnectionsPage() {
  const { t } = useTranslation();
  const validators = useValidators();
  const { servers, loginAndSaveServer, removeServer, setServerEnabled } = useServerContext();
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
      toast.error(error instanceof Error ? error.message : t('connections.messages.failed'));
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
      <View className="mt-4 gap-3">
        <InputController
          control={control}
          name="displayName"
          label={t('inputs.displayName')}
          placeholder={t('placeholders.displayName')}
          error={errors.displayName?.message}
        />
        <InputController
          control={control}
          name="serverUrl"
          label={t('inputs.serverUrl')}
          placeholder={t('placeholders.serverUrl')}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          error={errors.serverUrl?.message}
        />
        <InputController
          control={control}
          name="email"
          label={t('inputs.email')}
          placeholder={t('placeholders.email')}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          error={errors.email?.message}
        />
        <InputController
          control={control}
          name="password"
          label={t('inputs.password')}
          placeholder={t('placeholders.password')}
          secureTextEntry
          error={errors.password?.message}
        />
        <View className="flex-row gap-3 justify-end mt-2">
          <Button variant="secondary" onPress={() => setSelectedProvider(null)}>
            {t('connections.actions.chooseOther')}
          </Button>
          <Button onPress={handleSubmit(onConnectCoreNas)} loading={isSavingCoreNas}>
            {t('connections.actions.addCoreNas')}
          </Button>
        </View>
      </View>
    ) : (
      <View className="mt-4 gap-3">
        <Text variant="muted">
          {t('connections.oauth', {
            provider: t(providerMeta[selectedProvider].titleKey),
          })}
        </Text>
        <Button onPress={() => null}>
          {t('connections.actions.connectWith', {
            provider: t(providerMeta[selectedProvider].titleKey),
          })}
        </Button>
      </View>
    )
  ) : null;

  return (
    <BaseLayout>
      <Text variant="h1">{t('connections.title')}</Text>
      <Text variant="p">{t('connections.subtitle')}</Text>
      <View className="border-border border-dashed border-2 p-4 rounded my-5">
        <Text variant="h2">{t('connections.add')}</Text>
        <Text variant="muted">
          {selectedProvider
            ? t('connections.setup', {
                provider: t(providerMeta[selectedProvider].titleKey),
              })
            : t('connections.select')}
        </Text>

        {!selectedProvider ? (
          <View className="mt-4 gap-3 grid md:grid-cols-2 xl:grid-cols-3">
            {Object.entries(providerMeta).map(([provider, meta]) => (
              <Pressable
                key={provider}
                className="p-4 flex-row gap-4 rounded-lg border-border border hover:bg-muted"
                onPress={() => setSelectedProvider(provider as Provider)}
              >
                <View className="gap-4 flex-row shrink">
                  {meta.icon}
                  <View className="gap-1 shrink">
                    <Text variant="h3">{t(meta.titleKey)}</Text>
                    <Text variant="muted">{t(meta.descriptionKey)}</Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        ) : (
          providerConfig
        )}
      </View>
      <Text variant="h2" className="mb-3">
        {t('connections.existing')}
      </Text>
      {servers.length === 0 ? (
        <Text variant="muted" className="mx-auto mt-9">
          {t('connections.messages.none')}
        </Text>
      ) : (
        <View className="gap-3 grid md:grid-cols-2 xl:grid-cols-3">
          {servers.map((server) => (
            <View key={server.id} className="border-border border rounded p-4 gap-2">
              <Text variant="h4">{server.label}</Text>
              <Text variant="muted">{server.baseUrl}</Text>
              <Text variant="small">
                {server.disabled ? t('connections.status.disabled') : t('connections.status.enabled')}
              </Text>
              <View className="flex-row gap-2">
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
              </View>
            </View>
          ))}
        </View>
      )}
    </BaseLayout>
  );
}
