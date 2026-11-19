import { forwardRef } from 'react';
import styled from 'styled-components';
import { theme } from '../config/theme';
import { Check, Dot } from '../assets/icons';
import { defaultPasswordRequirements, type PasswordRequirement } from '../config/validators';
import { type InputProps } from './input';
import { PasswordInput } from './password-input';
import { Text } from './text';
import { TextInput, View } from 'react-native';

type StyledProps = {
  $isMet: boolean;
  $isError?: boolean;
};

const RequirementList = styled.ul`
  display: grid;
  gap: ${theme.spacing[100]};
  padding: ${theme.spacing[150]};
  margin: 0;
  list-style: none;
`;
const Item = styled.li<StyledProps>`
  display: flex;
  align-items: center;
  gap: ${theme.spacing[100]};
  color: ${({ $isMet, $isError }) =>
    $isMet ? theme.colors.text.success : $isError ? theme.colors.text.danger : theme.colors.text.secondary};
`;

type Props = Omit<InputProps, 'secureTextEntry' | 'icon'> & {
  requirements?: PasswordRequirement[];
};

export const SetPasswordInput = forwardRef<TextInput, Props>(
  ({ requirements = defaultPasswordRequirements, value, error, style, ...inputProps }, ref) => {
    const passwordValue = typeof value === 'string' ? value : '';
    const requirementStatuses = requirements.map((requirement) => ({
      ...requirement,
      isMet: requirement.validate(passwordValue),
    }));

    return (
      <View style={style}>
        <PasswordInput ref={ref} value={value} error={error} {...inputProps} />
        <RequirementList aria-label="Password requirements">
          {requirementStatuses.map((requirement) => (
            <Item key={requirement.id} $isMet={requirement.isMet} $isError={!!error}>
              {requirement.isMet ? <Check width={16} height={16} aria-hidden /> : <Dot aria-hidden />}
              <Text.Caption color="inherit">{requirement.label}</Text.Caption>
            </Item>
          ))}
        </RequirementList>
      </View>
    );
  }
);

SetPasswordInput.displayName = 'SetPasswordInput';
