import { useMutation } from '@tanstack/react-query';
import { View } from 'react-native';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useUserContext } from '@/providers/UserProvider';
import { Button } from '@/components/general/button';
import { InputController } from '@/components/controllers/input.controller';
import { type AuthResponse } from '@repo/shared';

type LoginForm = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const { t } = useTranslation();
  const { setUser } = useUserContext();
  const schema = yup.object().shape({
    email: yup
      .string()
      .email(t('auth.login.validation.emailInvalid'))
      .required(t('auth.login.validation.emailRequired')),
    password: yup.string().required(t('auth.login.validation.passwordRequired')),
  });

  const { mutate: login, isPending } = useMutation<AuthResponse, Error, LoginForm>({
    mutationKey: ['login'],
    mutationFn: async (_data) => ({ user: {} }) as AuthResponse,
    onSuccess: (data) => {
      setUser(data.user);
      router.push('/files');
    },
  });

  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: yupResolver(schema),
    defaultValues: {
      // serverUrl: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = (values: LoginForm) => {
    login(values);
  };

  return (
    <View className="p-6 flex flex-1 gap-2 bg-background items-center">
      <View className="mt-48 max-w-sm w-full gap-6">
        <InputController
          control={control}
          name="email"
          label={t('auth.login.fields.email')}
          error={errors.email?.message}
        />
        <InputController
          control={control}
          name="password"
          label={t('auth.login.fields.password')}
          error={errors.password?.message}
          secureTextEntry
        />
        <Button onPress={handleSubmit(onSubmit)} loading={isPending}>
          {t('auth.login.actions.submit')}
        </Button>
      </View>
    </View>
  );
}
