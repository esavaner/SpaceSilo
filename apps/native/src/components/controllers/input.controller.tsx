import { Control, Controller, FieldValues } from 'react-hook-form';
import { Input } from '../form/input';
import { View } from 'react-native';
import { Label } from '../form/label';
import { Text } from '../general/text';

type Props = React.ComponentProps<typeof Input> & {
  control: Control<any, any, FieldValues>;
  name: string;
  label?: string;
  error?: string;
  onEnter?: () => void;
};

export const InputController = ({ control, name, label, error, onEnter, ...rest }: Props) => {
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
            value={field.value}
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
