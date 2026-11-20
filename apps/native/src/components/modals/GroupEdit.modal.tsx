import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import ColorPicker, { HueSlider, Panel1, Preview } from 'reanimated-color-picker';
import styled from 'styled-components/native';
import { useTranslation } from 'react-i18next';
import * as yup from 'yup';
import { Button, Input, Modal, ModalButtons, ModalTitle, theme, useModal } from '@repo/shared/components';
import { type GroupListItem } from '@/hooks/useGroupList';
import { useGroupActions } from '@/hooks/useGroupActions';

const PickerContainer = styled.View`
  width: 100%;
  max-width: 300px;
  align-self: center;
`;

const PickerRow = styled.View`
  flex-direction: row;
  gap: ${theme.spacing[200]};
`;

type GroupEditForm = {
  name: string;
  color?: string;
};

type Props = {
  group: Pick<GroupListItem, 'id' | 'name' | 'color' | 'serverId'>;
};

export const GroupEditModal = ({ group }: Props) => {
  const { t } = useTranslation();
  const { closeModal } = useModal();
  const { updateGroup, isPending } = useGroupActions();
  const schema = yup.object({
    name: yup.string().trim().required(t('groups.createModal.validation.nameRequired')),
    color: yup.string().optional(),
  });
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<GroupEditForm>({
    resolver: yupResolver(schema),
    defaultValues: {
      name: group.name,
      color: group.color ?? '',
    },
  });

  const handleSave = (values: GroupEditForm) => {
    updateGroup({
      id: group.id,
      serverId: group.serverId,
      name: values.name,
      color: values.color?.trim() ? values.color : undefined,
    });
  };

  return (
    <Modal closeLabel={t('common.actions.close')} accessibilityLabel={t('groups.details.editGroup')}>
      <ModalTitle>{t('groups.details.editGroup')}</ModalTitle>
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
        name="color"
        render={({ field }) => (
          <PickerContainer>
            <ColorPicker
              value={field.value || group.color || '#ffffff'}
              style={{ width: '100%', gap: 10 }}
              onComplete={(value) => field.onChange(value.hex)}
            >
              <Preview />
              <PickerRow>
                <Panel1 style={{ flex: 1 }} />
                <HueSlider vertical />
              </PickerRow>
            </ColorPicker>
          </PickerContainer>
        )}
      />

      <ModalButtons>
        <Button variant="secondary" onPress={closeModal} disabled={isPending}>
          {t('common.actions.cancel')}
        </Button>
        <Button onPress={handleSubmit(handleSave)} loading={isPending}>
          {t('common.actions.save')}
        </Button>
      </ModalButtons>
    </Modal>
  );
};
