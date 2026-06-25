import { type Control, Controller, type FieldPath, type FieldValues } from 'react-hook-form';
import { Input } from '../form/input';
import { View } from 'react-native';
import { Label } from '../form/label';
import { Text } from '../general/text';

type Props<TFieldValues extends FieldValues> = Omit<React.ComponentProps<typeof Input>, 'value' | 'onChangeText'> & {
  control: Control<TFieldValues, unknown, FieldValues>;
  name: FieldPath<TFieldValues>;
  label?: string;
  error?: string;
  onEnter?: () => void;
};

export const InputController = <TFieldValues extends FieldValues>({
  control,
  name,
  label,
  error,
  onEnter,
  ...rest
}: Props<TFieldValues>) => {
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
          <Input
            onBlur={field.onBlur}
            value={
              typeof field.value === 'string' ? field.value : field.value == null ? undefined : String(field.value)
            }
            onChangeText={field.onChange}
            onKeyPress={(e) => e.nativeEvent.key === 'Enter' && onEnter?.()}
            {...rest}
          />
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
