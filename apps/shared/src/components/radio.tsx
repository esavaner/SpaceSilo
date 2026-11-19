import { forwardRef, InputHTMLAttributes, ReactNode, useId } from 'react';
import styled, { css } from 'styled-components';
import { theme } from '../config/theme';
import { CircleCheck } from '../assets/icons';

type Variant = 'horizontal' | 'vertical';

type StyledProps = {
  $disabled?: boolean;
  $isError?: boolean;
  $variant?: Variant;
};

const HiddenInput = styled.input<StyledProps>`
  position: absolute;
  height: 1px;
  width: 1px;
  outline: none;
`;
const Label = styled.label<StyledProps>`
  ${theme.text.button}
  position: relative;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  transition:
    background 0.15s ease,
    border 0.15s ease,
    color 0.15s ease;
  margin: 1px;
  border-radius: ${theme.radius[400]};
  background: ${theme.colors.surface.weak};
  border: ${theme.borderWeight[25]} solid
    ${({ $isError }) => ($isError ? theme.colors.border.error.default : theme.colors.border.input.default)};

  ${({ $variant }) =>
    $variant === 'vertical'
      ? css`
          flex-direction: column;
          padding: ${theme.spacing[400]};
          gap: ${theme.spacing[200]};
        `
      : css`
          padding: ${theme.spacing[200]} ${theme.spacing[400]};
          gap: ${theme.spacing[400]};
        `}

  ${({ $disabled }) =>
    $disabled
      ? css`
          color: ${theme.colors.text.disabled};
          background-color: ${theme.colors.disabled};
          box-shadow: none;
          cursor: not-allowed;
        `
      : css`
          color: ${theme.colors.text.default};
          cursor: pointer;

          &:hover {
            background: ${theme.colors.surface.default};
            border: ${theme.borderWeight[25]} solid ${theme.colors.border.input.hover};
            box-shadow: 0 0 0 4px #f7f3f0;
          }

          &:active,
          &:focus-within,
          &:has(${HiddenInput}:checked) {
            background: ${theme.colors.surface.medium};
            border: ${theme.borderWeight[25]} solid ${theme.colors.border.input.active};
            box-shadow: 0 0 0 1px ${theme.colors.border.input.active};
          }
        `}
`;
const Checkmark = styled(CircleCheck)`
  color: ${theme.colors.primary.default};
  position: absolute;
  top: 8px;
  right: 12px;
  width: 24px;
  height: 24px;
`;
const Circle = styled.div`
  position: absolute;
  border-radius: ${theme.radius.full};
  border: ${theme.borderWeight[25]} solid ${theme.colors.border.primary.default};
  top: 10px;
  right: 14px;
  width: 20px;
  height: 20px;
`;

export type RadioProps = InputHTMLAttributes<HTMLInputElement> & {
  children?: ReactNode;
  error?: string;
  variant?: Variant;
};

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ id, children, error, disabled, checked, className, style, variant = 'horizontal', ...rest }, ref) => {
    const inputId = id || `radio-${useId().replace(/:/g, '')}`;
    const labelId = `${inputId}-label`;
    const isError = !!error;

    return (
      <Label
        id={labelId}
        htmlFor={inputId}
        $disabled={disabled}
        $isError={isError}
        $variant={variant}
        className={className}
        style={style}
      >
        <HiddenInput
          ref={ref}
          id={inputId}
          type="radio"
          disabled={disabled}
          checked={checked}
          $disabled={disabled}
          aria-invalid={isError || undefined}
          {...rest}
        />
        {children}
        {checked ? <Checkmark /> : <Circle />}
      </Label>
    );
  }
);

Radio.displayName = 'Radio';
