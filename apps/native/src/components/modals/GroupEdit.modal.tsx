import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import ColorPicker, { HueSlider, Panel1, Preview } from 'reanimated-color-picker';
import { View } from 'react-native';
import * as yup from 'yup';
import { type GroupListItem } from '@/hooks/useGroupList';
import { useGroupActions } from '@/hooks/useGroupActions';
import { InputController } from '../controllers/input.controller';
import { DialogContent, DialogHeader, DialogTitle } from './dialog';
import { DialogFooter } from './dialog-footer';

const schema = yup.object({
  name: yup.string().trim().required('Group name is required'),
  color: yup.string().optional(),
});

type GroupEditForm = yup.InferType<typeof schema>;

type Props = {
  group: Pick<GroupListItem, 'id' | 'name' | 'color' | 'serverId'>;
};

export const GroupEditModal = ({ group }: Props) => {
  const { updateGroup, isPending } = useGroupActions();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<GroupEditForm>({
    // @ts-expect-error yup resolver typing
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
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Edit group</DialogTitle>
      </DialogHeader>

      <InputController control={control} name="name" label="Name" error={errors.name?.message} />

      <Controller
        control={control}
        name="color"
        render={({ field }) => (
          <View className="items-center gap-3">
            <ColorPicker
              value={field.value || group.color || '#ffffff'}
              style={{ width: 300, gap: 10 }}
              onComplete={(value) => field.onChange(value.hex)}
            >
              <Preview />
              <View className="flex-row gap-2">
                <Panel1 style={{ flex: 1 }} />
                <HueSlider vertical />
              </View>
            </ColorPicker>
          </View>
        )}
      />

      {/* @ts-expect-error dialog footer handler typing */}
      <DialogFooter okText="Save" onOk={handleSubmit(handleSave)} loading={isPending} />
    </DialogContent>
  );
};
