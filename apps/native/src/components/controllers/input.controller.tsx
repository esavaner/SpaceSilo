import { Control, Controller, FieldValues } from 'react-hook-form';
import { Input } from '../form/input';
import { View } from 'react-native';
import { Label } from '../form/label';
import { Text } from '../general/text';

type Props = {
  control: Control<any, any, FieldValues>;
  name: string;
  label?: string;
  error?: string;
};

export const InputController = ({ control, name, label, error }: Props) => {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <View className="gap-1.5">
          {label && (
            <Label htmlFor={name} nativeID={name}>
              {label}
            </Label>
          )}
          <Input onBlur={field.onBlur} value={field.value} onChangeText={field.onChange} />
          {error && (
            <Text className="text-destructive" variant="small">
              {error}
            </Text>
          )}
        </View>
      )}
    />
  );
};
