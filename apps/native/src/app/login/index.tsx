import { Api } from '@/api/api';
import { Button, Input } from '@repo/ui';
import { useMutation } from '@tanstack/react-query';
import { View } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { router } from 'expo-router';

const schema = yup.object().shape({
  serverUrl: yup.string().required('Server URL is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().required('Password is required'),
});

type LoginForm = yup.InferType<typeof schema>;

export default function LoginPage() {
  const { mutate: login } = useMutation({
    mutationKey: ['login'],
    mutationFn: Api.auth.authControllerLogin,
    onSuccess: () => {
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
      serverUrl: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = (values: LoginForm) => {
    login(values);
  };

  return (
    <View className="p-6 flex gap-2 w-full max-w-96 mx-auto">
      <Controller
        control={control}
        render={({ field }) => (
          <Input
            onBlur={field.onBlur}
            value={field.value}
            onChangeText={field.onChange}
            label="Server URL"
            error={errors.email?.message}
          />
        )}
        name="serverUrl"
      />
      <Controller
        control={control}
        render={({ field }) => (
          <Input
            onBlur={field.onBlur}
            value={field.value}
            onChangeText={field.onChange}
            label="Email"
            error={errors.email?.message}
          />
        )}
        name="email"
      />
      <Controller
        control={control}
        render={({ field }) => (
          <Input
            onBlur={field.onBlur}
            value={field.value}
            onChangeText={field.onChange}
            label="Password"
            error={errors.password?.message}
          />
        )}
        name="password"
      />
      <Button variant="primary" onPress={handleSubmit(onSubmit)} className="w-full">
        Login
      </Button>
    </View>
  );
}
