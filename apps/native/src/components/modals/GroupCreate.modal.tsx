import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useGroupActions } from '@/hooks/useGroupActions';
import ColorPicker, { Panel1, Preview, HueSlider } from 'reanimated-color-picker';
import { View } from 'react-native';
import { DialogContent, DialogHeader, DialogTitle } from './dialog';
import { InputController } from '../controllers/input.controller';
import { DialogFooter } from './dialog-footer';

const schema = yup.object().shape({
  name: yup.string().required('Group name is required'),
  id: yup.string().required('Group id is required'),
  color: yup.string(),
});

type CreateGroupForm = yup.InferType<typeof schema>;

export const GroupCreateModal = () => {
  const { t } = useTranslation();
  const { createGroup, isPending } = useGroupActions();

  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateGroupForm>({
    // @ts-expect-error schema
    resolver: yupResolver(schema),
  });

  const onSubmit = (values: CreateGroupForm) => {
    createGroup({ ...values, members: [] });
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{t('Create Group')}</DialogTitle>
      </DialogHeader>
      <InputController control={control} name="name" label={t('Name')} error={errors.name?.message} />
      <InputController control={control} name="id" label={t('Group ID')} error={errors.id?.message} />
      <Controller
        control={control}
        name="color"
        render={({ field }) => (
          <View className="items-center">
            <ColorPicker style={{ width: 300, gap: 10 }} onComplete={(value) => field.onChange(value.hex)}>
              <Preview />
              <View className="flex-row gap-2">
                <Panel1 style={{ flex: 1 }} />
                <HueSlider vertical />
              </View>
            </ColorPicker>
          </View>
        )}
      />
      {/* @ts-expect-error sada sdsa */}
      <DialogFooter okText={t('create')} onOk={handleSubmit(onSubmit)} loading={isPending} />
    </DialogContent>
  );
};
