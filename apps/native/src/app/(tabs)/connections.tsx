import { BaseLayout } from '@/components/base-layout';
import { InputController } from '@/components/controllers/input.controller';
import { Button } from '@/components/general/button';
import { Text } from '@/components/general/text';
import { ServerType } from '@/api/_client';
import { endpoints } from '@/api/core.client';
import { useValidators } from '@/hooks/useValidators';
import { useServerContext } from '@/providers/ServerProvider';
import { useUi } from '@/providers/UiProvider';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { View } from 'react-native';
import * as yup from 'yup';

const providerMeta = {
  coreNas: {
    titleKey: 'connections.providers.coreNas.title',
    descriptionKey: 'connections.providers.coreNas.desc',
  },
  googleDrive: {
    titleKey: 'connections.providers.googleDrive.title',
    descriptionKey: 'connections.providers.googleDrive.desc',
  },
  dropbox: {
    titleKey: 'connections.providers.dropbox.title',
    descriptionKey: 'connections.providers.dropbox.desc',
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
  const { toast } = useUi();
  const { servers, loginAndSaveServer, removeServer, setServerEnabled } = useServerContext();
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [isSavingCoreNas, setIsSavingCoreNas] = useState(false);
  const [busyServerId, setBusyServerId] = useState<string | null>(null);

  const coreNasSchema = useMemo(
    () =>
      yup.object({
        displayName: validators.displayName,
        serverUrl: validators.serverUrl,
        email: validators.email,
        password: validators.password,
      }),
    [validators]
  );

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CoreNasForm>({
    resolver: yupResolver(coreNasSchema),
    defaultValues: {
      displayName: '',
      serverUrl: '',
      email: '',
      password: '',
    },
  });

  const coreServers = useMemo(() => {
    const core = servers.filter((server) => server.type === ServerType.CORE);
    return core.filter((server, index, list) => list.findIndex((item) => item.id === server.id) === index);
  }, [servers]);

  const onConnectCoreNas = async (values: CoreNasForm) => {
    let savedServer: (typeof coreServers)[number] | undefined;
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

        <Button onPress={handleSubmit(onConnectCoreNas)} loading={isSavingCoreNas}>
          {t('connections.actions.addCoreNas')}
        </Button>
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
      <View className="border-border border p-4 rounded my-5">
        <Text variant="h3">{t('connections.add')}</Text>
        <Text variant="muted">
          {selectedProvider
            ? t('connections.setup', {
                provider: t(providerMeta[selectedProvider].titleKey),
              })
            : t('connections.select')}
        </Text>

        {!selectedProvider ? (
          <View className="mt-4 gap-3">
            {(Object.entries(providerMeta) as [Provider, (typeof providerMeta)[Provider]][]).map(([provider, meta]) => (
              <Button
                key={provider}
                variant="outline"
                className="h-auto items-start py-4"
                onPress={() => setSelectedProvider(provider)}
              >
                <View className="w-full gap-1">
                  <Text variant="h4">{t(meta.titleKey)}</Text>
                  <Text variant="muted">{t(meta.descriptionKey)}</Text>
                </View>
              </Button>
            ))}
          </View>
        ) : (
          providerConfig
        )}

        {selectedProvider && (
          <Button variant="ghost" className="mt-3 self-start px-0" onPress={() => setSelectedProvider(null)}>
            {t('connections.actions.chooseOther')}
          </Button>
        )}
      </View>
      <Text variant="h3">{t('connections.existing')}</Text>
      <View className="mt-3 gap-3">
        {coreServers.length === 0 ? (
          <Text variant="muted">{t('connections.messages.none')}</Text>
        ) : (
          coreServers.map((server) => (
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
                  disabled={busyServerId === server.id}
                  loading={busyServerId === server.id}
                >
                  {server.disabled ? t('connections.actions.enable') : t('connections.actions.disable')}
                </Button>
                <Button
                  variant="destructive"
                  onPress={() => onRemoveCoreServer(server.id)}
                  disabled={busyServerId === server.id}
                  loading={busyServerId === server.id}
                >
                  {t('connections.actions.remove')}
                </Button>
              </View>
            </View>
          ))
        )}
      </View>
    </BaseLayout>
  );
}
