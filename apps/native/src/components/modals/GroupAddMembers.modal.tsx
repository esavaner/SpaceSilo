import { AddMembersDto } from '@/api/generated';
import { useGroupActions } from '@/hooks/useGroupActions';
import { Shape } from '@/utils/types';
import { ModalTitle, Search, useUi } from '@repo/ui';
import { useTranslation } from 'react-i18next';
import * as yup from 'yup';
import { ButtonGroup } from './ButtonGroup';

const schema = yup.object<Shape<AddMembersDto>>({
  members: yup.array().of(yup.string().required('Member is required')),
});

export const GroupAddMembersModal = () => {
  const { t } = useTranslation();
  const { closeModal } = useUi();
  const { addMembers } = useGroupActions();

  return (
    <>
      <ModalTitle>{t('addMembers')}</ModalTitle>
      <Search options={[]} />
      <ButtonGroup okText={t('Add')} onCancel={closeModal} onOk={() => null} />
    </>
  );
};
