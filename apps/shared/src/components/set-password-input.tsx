import { forwardRef } from 'react';
import styled from 'styled-components';
import { Check, Dot } from '../assets/icons';
import { defaultPasswordRequirements, type PasswordRequirement } from '../config/validators';
import { type InputProps } from './input';
import { PasswordInput } from './password-input';
import { Text } from './text';

type StyledProps = {
  $isMet: boolean;
  $isError?: boolean;
};

const RequirementList = styled.ul`
  display: grid;
  gap: var(--spacing-100);
  padding: var(--spacing-150);
  margin: 0;
  list-style: none;
`;
const Item = styled.li<StyledProps>`
  display: flex;
  align-items: center;
  gap: var(--spacing-100);
  color: ${({ $isMet, $isError }) =>
    $isMet
      ? 'var(--text-status-success-default)'
      : $isError
        ? 'var(--text-status-danger-default)'
        : 'var(--text-secondary-default)'};
`;

type Props = Omit<InputProps, 'type' | 'icon'> & {
  requirements?: PasswordRequirement[];
};

export const SetPasswordInput = forwardRef<HTMLInputElement, Props>(
  ({ requirements = defaultPasswordRequirements, value, error, style, className, ...inputProps }, ref) => {
    const passwordValue = typeof value === 'string' ? value : '';
    const requirementStatuses = requirements.map((requirement) => ({
      ...requirement,
      isMet: requirement.validate(passwordValue),
    }));

    return (
      <div style={style} className={className}>
        <PasswordInput ref={ref} value={value} error={error} {...inputProps} />
        <RequirementList aria-label="Password requirements">
          {requirementStatuses.map((requirement) => (
            <Item key={requirement.id} $isMet={requirement.isMet} $isError={!!error}>
              {requirement.isMet ? <Check width={16} height={16} aria-hidden /> : <Dot aria-hidden />}
              <Text.Caption color="inherit">{requirement.label}</Text.Caption>
            </Item>
          ))}
        </RequirementList>
      </div>
    );
  }
);

SetPasswordInput.displayName = 'SetPasswordInput';
