import { forwardRef, useState } from 'react';
import styled from 'styled-components/native';
import { theme } from '../config/theme';
import { Check, Dot } from '../assets/icons';
import { defaultPasswordRequirements, type PasswordRequirement } from '../config/validators';
import { type InputProps } from './input';
import { PasswordInput } from './password-input';
import { Text } from './text';
import { TextInput, View } from 'react-native';

const RequirementList = styled.View`
  display: flex;
  gap: ${theme.spacing[100]};
  padding: ${theme.spacing[150]};
`;
const Item = styled.View`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: ${theme.spacing[100]};
`;

type Props = Omit<InputProps, 'secureTextEntry' | 'icon'> & {
  requirements?: PasswordRequirement[];
};

export const SetPasswordInput = forwardRef<TextInput, Props>(
  (
    { requirements = defaultPasswordRequirements, value, defaultValue, onChangeText, error, style, ...inputProps },
    ref
  ) => {
    const [internalValue, setInternalValue] = useState(defaultValue ?? '');
    const passwordValue = value ?? internalValue;
    const requirementStatuses = requirements.map((requirement) => ({
      ...requirement,
      isMet: requirement.validate(passwordValue),
    }));

    return (
      <View style={style}>
        <PasswordInput
          ref={ref}
          value={value}
          defaultValue={defaultValue}
          error={error}
          onChangeText={(text) => {
            if (value === undefined) setInternalValue(text);
            onChangeText?.(text);
          }}
          {...inputProps}
        />
        <RequirementList role="list" accessibilityLabel="Password requirements">
          {requirementStatuses.map((requirement) => {
            const color = requirement.isMet
              ? theme.colors.text.success
              : error
                ? theme.colors.text.danger
                : theme.colors.text.secondary;

            return (
              <Item key={requirement.id} role="listitem">
                {requirement.isMet ? (
                  <Check width={16} height={16} color={color} aria-hidden />
                ) : (
                  <Dot color={color} aria-hidden />
                )}
                <Text.Caption color={color} style={{ flexShrink: 1 }}>
                  {requirement.label}
                </Text.Caption>
              </Item>
            );
          })}
        </RequirementList>
      </View>
    );
  }
);

SetPasswordInput.displayName = 'SetPasswordInput';
