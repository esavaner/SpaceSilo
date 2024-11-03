import { Api } from '@/api/api';
import { Button, Input } from '@repo/ui';
import { useMutation } from '@tanstack/react-query';
import { View } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const schema = yup.object().shape({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().required('Password is required'),
});

type LoginForm = yup.InferType<typeof schema>;

export default function LoginPage() {
  const { mutate: login } = useMutation({
    mutationKey: ['login'],
    mutationFn: Api.auth.authControllerLogin,
  });

  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: yupResolver(schema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = (values: LoginForm) => {
    login(values);
  };

  return (
    <View className="p-6">
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
      <Button variant="primary" onPress={handleSubmit(onSubmit)}>
        Login
      </Button>
    </View>
  );
}
