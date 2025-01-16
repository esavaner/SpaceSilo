import { AddMembersDto } from '@/api/generated';
import { useGroupActions } from '@/hooks/useGroupActions';
import { Shape } from '@/utils/types';
import { ModalTitle, Search, useUi, Text } from '@repo/ui';
import { useTranslation } from 'react-i18next';
import * as yup from 'yup';
import { ButtonGroup } from './ButtonGroup';
import { useState } from 'react';

const schema = yup.object<Shape<AddMembersDto>>({
  members: yup.array().of(yup.string().required('Member is required')),
});

export const GroupAddMembersModal = () => {
  const { t } = useTranslation();
  const { closeModal } = useUi();
  const { addMembers } = useGroupActions();

  const [options, setOptions] = useState<React.ReactNode[]>([]);
  const [value, setValue] = useState<string>('');

  const onChangeText = (text: string) => {
    setValue(text);

    if (text.length < 3) {
      return;
    }
    setOptions([<Text>{text}</Text>]);
  };

  return (
    <>
      <ModalTitle>{t('addMembers')}</ModalTitle>
      <Search options={options} onChangeText={onChangeText} />
      <ButtonGroup okText={t('Add')} onCancel={closeModal} onOk={() => null} />
    </>
  );
};
