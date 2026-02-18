import { useMutation } from '@tanstack/react-query';
import { View } from 'react-native';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { router } from 'expo-router';
import { useUserContext } from '@/providers/UserProvider';
import { Button } from '@/components/general/button';
import { InputController } from '@/components/controllers/input.controller';

const schema = yup.object().shape({
  // serverUrl: yup.string().required('Server URL is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().required('Password is required'),
});

type LoginForm = yup.InferType<typeof schema>;

export default function LoginPage() {
  const { setUser } = useUserContext();

  const { mutate: login, isPending } = useMutation({
    mutationKey: ['login'],
    mutationFn: (data: any) => ({ data: {} }) as any,
    onSuccess: (data: any) => {
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
    <View className="p-6 flex flex-1 gap-2 bg-background items-center">
      <View className="mt-48 max-w-sm w-full gap-6">
        <InputController control={control} name="email" label="Email" error={errors.email?.message} />
        <InputController
          control={control}
          name="password"
          label="Password"
          error={errors.password?.message}
          secureTextEntry
        />
        <Button onPress={handleSubmit(onSubmit)} loading={isPending}>
          Login
        </Button>
      </View>
    </View>
  );
}
