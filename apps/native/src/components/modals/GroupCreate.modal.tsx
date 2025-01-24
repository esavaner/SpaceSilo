import { useUi, ModalTitle, Input, ModalLayout } from '@repo/ui';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ButtonGroup } from './ButtonGroup';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useGroupActions } from '@/hooks/useGroupActions';

const schema = yup.object().shape({
  name: yup.string().required('Group name is required'),
  id: yup.string().required('Group id is required'),
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
    resolver: yupResolver(schema),
  });

  const onSubmit = ({ id, name }: CreateGroupForm) => {
    // create({ newPath: currentPath, name: values.folder });
    createGroup({ id, name, members: [] });
  };

  return (
    <ModalLayout>
      <ModalTitle>{t('createFolder')}</ModalTitle>
      <Controller
        control={control}
        name="name"
        render={({ field }) => (
          <Input
            label={t('name')}
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
            label={t('id')}
            onBlur={field.onBlur}
            value={field.value}
            onChangeText={field.onChange}
            error={errors.id?.message}
          />
        )}
      />
      <ButtonGroup okText={t('create')} onCancel={closeModal} onOk={handleSubmit(onSubmit)} />
    </ModalLayout>
  );
};
