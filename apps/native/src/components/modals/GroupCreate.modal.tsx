import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ButtonGroup } from './ButtonGroup';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useGroupActions } from '@/hooks/useGroupActions';
import ColorPicker, { Panel1, Preview, HueSlider } from 'reanimated-color-picker';
import { View } from 'react-native';
import { useUi } from '@/providers/UiProvider';
import { Input } from '../input';
import { ModalLayout, ModalTitle } from '../modal-components';

const schema = yup.object().shape({
  name: yup.string().required('Group name is required'),
  id: yup.string().required('Group id is required'),
  color: yup.string(),
});

type CreateGroupForm = yup.InferType<typeof schema>;

export const GroupCreateModal = () => {
  const { t } = useTranslation();
  const { closeModal } = useUi();
  const { createGroup } = useGroupActions();

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
    <ModalLayout>
      <ModalTitle>{t('Create Group')}</ModalTitle>
      <Controller
        control={control}
        name="name"
        render={({ field }) => (
          <Input
            label={t('Name')}
            onBlur={field.onBlur}
            value={field.value}
            onChangeText={field.onChange}
            error={errors.name?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="id"
        render={({ field }) => (
          <Input
            label={t('Group ID')}
            onBlur={field.onBlur}
            value={field.value}
            onChangeText={field.onChange}
            error={errors.id?.message}
          />
        )}
      />
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
      <ButtonGroup okText={t('create')} onCancel={closeModal} onOk={handleSubmit(onSubmit)} className="pt-4" />
    </ModalLayout>
  );
};
