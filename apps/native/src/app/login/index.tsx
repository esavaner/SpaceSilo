import { Api } from '@/api/api';
import { useMutation } from '@tanstack/react-query';
import { View } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { router } from 'expo-router';
import { useUserContext } from '@/providers/UserProvider';
import { LoginDto } from '@/api/generated';
import { Input } from '@/components/input';
import { Button } from '@/components/button';

const schema = yup.object().shape({
  // serverUrl: yup.string().required('Server URL is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().required('Password is required'),
});

type LoginForm = yup.InferType<typeof schema>;

export default function LoginPage() {
  const { setUser } = useUserContext();

  const { mutate: login } = useMutation({
    mutationKey: ['login'],
    mutationFn: (data: LoginDto) => Api.auth.authControllerLogin(data),
    onSuccess: (data) => {
      setUser(data.data);
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
    <View className="p-6 flex flex-1 gap-2 bg-layer items-center">
      <View className="mt-48 max-w-sm w-full">
        {/* <Controller
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
      /> */}
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
              secureTextEntry
            />
          )}
          name="password"
        />
        <Button variant="primary" onPress={handleSubmit(onSubmit)} className="">
          Login
        </Button>
      </View>
    </View>
  );
}
