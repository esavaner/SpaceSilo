import { forwardRef, useState } from 'react';
import styled from 'styled-components/native';
import { theme, useThemeColors } from '../config/theme';
import { Icon } from '../assets/icons';
import { defaultPasswordRequirements, type PasswordRequirement } from '../config/validators';
import { PasswordInput, type PasswordInputProps } from './password-input';
import { Text } from './text';
import { TextInput, View } from 'react-native';

const RequirementList = styled.View`
  gap: ${theme.spacing[100]};
  padding: ${theme.spacing[150]};
`;
const Item = styled.View`
  flex-direction: row;
  align-items: center;
  gap: ${theme.spacing[100]};
`;

type Props = PasswordInputProps & {
  requirements?: PasswordRequirement[];
};

export const SetPasswordInput = forwardRef<TextInput, Props>(
  (
    { requirements = defaultPasswordRequirements, value, defaultValue, onChangeText, error, style, ...inputProps },
    ref
  ) => {
    const [internalValue, setInternalValue] = useState(defaultValue ?? '');
    const colors = useThemeColors();
    const passwordValue = value ?? internalValue;
    const requirementStatuses = requirements.map((requirement) => ({
      ...requirement,
      isMet: requirement.validate(passwordValue),
    }));

    return (
      <View style={style}>
        <PasswordInput
          ref={ref}
          autoComplete="new-password"
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
            const color = requirement.isMet ? colors.text.success : error ? colors.text.danger : colors.text.secondary;

            return (
              <Item key={requirement.id} role="listitem">
                {requirement.isMet ? <Icon.Check size={16} color={color} aria-hidden /> : <Icon.Dot color={color} aria-hidden />}
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
