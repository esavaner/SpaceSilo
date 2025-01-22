import { useUi, ModalTitle, Input, ModalLayout } from '@repo/ui';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ButtonGroup } from './ButtonGroup';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useGroupActions } from '@/hooks/useGroupActions';

const schema = yup.object().shape({
  groupName: yup.string().required('Group name is required'),
  groupId: yup.string().required('Group id is required'),
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

  const onSubmit = ({ groupId, groupName }: CreateGroupForm) => {
    // create({ newPath: currentPath, name: values.folder });
    createGroup({ groupId, groupName });
  };

  return (
    <ModalLayout>
      <ModalTitle>{t('createFolder')}</ModalTitle>
      <Controller
        control={control}
        name="groupName"
        render={({ field }) => (
          <Input
            label={t('groupName')}
            onBlur={field.onBlur}
            value={field.value}
            onChangeText={field.onChange}
            error={errors.groupName?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="groupId"
        render={({ field }) => (
          <Input
            label={t('groupId')}
            onBlur={field.onBlur}
            value={field.value}
            onChangeText={field.onChange}
            error={errors.groupId?.message}
          />
        )}
      />
      <ButtonGroup okText={t('create')} onCancel={closeModal} onOk={handleSubmit(onSubmit)} />
    </ModalLayout>
  );
};
