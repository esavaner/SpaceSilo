import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useGroupActions } from '@/hooks/useGroupActions';
import ColorPicker, { Panel1, Preview, HueSlider } from 'reanimated-color-picker';
import styled from 'styled-components/native';
import { Button, Input, theme } from '@repo/shared/components';
import { DialogContent, DialogFooter, DialogHeader, DialogTitle } from './dialog';
import { useUi } from '@/providers/UiProvider';

const PickerContainer = styled.View`
  align-items: center;
`;

const PickerRow = styled.View`
  flex-direction: row;
  gap: ${theme.spacing[200]};
`;

type CreateGroupForm = {
  color?: string;
  id: string;
  name: string;
};

export const GroupCreateModal = () => {
  const { t } = useTranslation();
  const { closeModal } = useUi();
  const { createGroup, isPending } = useGroupActions();
  const schema = yup.object().shape({
    name: yup.string().required(t('groups.createModal.validation.nameRequired')),
    id: yup.string().required(t('groups.createModal.validation.groupIdRequired')),
    color: yup.string(),
  });

  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateGroupForm>({
    resolver: yupResolver(schema),
  });

  const onSubmit = (values: CreateGroupForm) => {
    createGroup({ ...values, members: [] });
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{t('groups.createModal.title')}</DialogTitle>
      </DialogHeader>
      <Controller
        control={control}
        name="name"
        render={({ field }) => (
          <Input
            label={t('common.labels.name')}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.name?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="id"
        render={({ field }) => (
          <Input
            label={t('common.labels.groupId')}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.id?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="color"
        render={({ field }) => (
          <PickerContainer>
            <ColorPicker style={{ width: 300, gap: 10 }} onComplete={(value) => field.onChange(value.hex)}>
              <Preview />
              <PickerRow>
                <Panel1 style={{ flex: 1 }} />
                <HueSlider vertical />
              </PickerRow>
            </ColorPicker>
          </PickerContainer>
        )}
      />
      <DialogFooter>
        <Button variant="secondary" onPress={closeModal} disabled={isPending}>
          {t('common.actions.cancel')}
        </Button>
        <Button onPress={handleSubmit(onSubmit)} loading={isPending}>
          {t('common.actions.create')}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};
