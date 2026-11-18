import { forwardRef, InputHTMLAttributes, ReactNode, useEffect, useId, useRef, useState } from 'react';
import styled, { css } from 'styled-components';
import { theme } from '../config/theme';
import { Check, Info } from '../assets/icons';
import { InputInfo as InputInfoBase } from './input';

type StyledProps = {
  $disabled?: boolean;
  $checked?: boolean;
  $error?: boolean;
};

const Wrapper = styled.div`
  display: grid;
`;
const Label = styled.label<StyledProps>`
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: start;
  gap: var(--spacing-300);
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
`;
const CheckboxControl = styled.span`
  position: relative;
  width: 1.25rem;
  height: 1.25rem;
`;
const HiddenInput = styled.input<StyledProps>`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  opacity: 0;
  border: 0;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  z-index: 1;
`;
const CheckboxVisual = styled.span<StyledProps>`
  position: absolute;
  inset: 0;
  border-radius: var(--border-radius-150);
  border: 1px solid var(--border-controls-primary-default);
  background-color: var(--fill-controls-tertiary-default);
  color: var(--icon-primary-inverted);
  pointer-events: none;
  transition: all 0.15s ease;

  ${HiddenInput}:focus-visible + & {
    outline: 2px solid var(--text-brand);
    outline-offset: 2px;
  }

  ${({ $error }) =>
    $error &&
    css`
      border-color: var(--border-status-error-default);
    `}

  ${({ $checked }) =>
    $checked
      ? css`
          background-color: var(--fill-controls-primary-default);
          color: var(--icon-primary-inverted);
        `
      : css`
          * {
            opacity: 0;
          }
        `}

  ${({ $disabled }) =>
    $disabled
      ? css`
          background-color: var(--fill-controls-disabled-disabled);
          color: var(--icon-disabled-disabled);
          border-color: var(--border-controls-disabled-disabled);
        `
      : css`
          ${Label}:hover & {
            border-color: var(--border-controls-primary-hover);
            box-shadow: 0 0 0 4px #e7f1e9;
          }
        `}
`;
const Checkmark = styled(Check)`
  width: 1.25rem;
  height: 1.25rem;
`;
const LabelText = styled.span`
  ${theme.text.formMessage}

  a {
    color: inherit;
    border-bottom: 1px solid var(--text-primary-default);
    text-decoration: none;

    &:hover {
      color: var(--text-brand);
      border-bottom-color: var(--text-brand);
    }
  }
`;
const InputInfo = styled(InputInfoBase)`
  padding-left: 0;
`;

type Props = InputHTMLAttributes<HTMLInputElement> & {
  children?: ReactNode;
  info?: string;
  error?: string;
  label?: string;
};

export const Checkbox = forwardRef<HTMLInputElement, Props>(
  (
    { id, name, children, label, checked, defaultChecked, info, error, disabled, className, style, onChange, ...rest },
    ref
  ) => {
    const inputId = id || name || `checkbox-${useId().replace(/:/g, '')}`;
    const labelId = `${inputId}-label`;
    const infoMessageId = `${inputId}-info`;
    const errorMessageId = `${inputId}-error`;

    const inputRef = useRef<HTMLInputElement>(null);
    const isControlled = checked !== undefined;
    const [internalChecked, setInternalChecked] = useState(() => !!defaultChecked);

    const hasInfo = !!info && !disabled;
    const hasError = !!error && !disabled;
    const describedBy = [hasInfo ? infoMessageId : undefined, hasError ? errorMessageId : undefined]
      .filter(Boolean)
      .join(' ');
    const isChecked = isControlled ? !!checked : internalChecked;

    // keep internal state in sync with form libraries that set initial values via ref
    useEffect(() => {
      if (isControlled) {
        return;
      }
      const value = inputRef.current?.checked;
      if (typeof value === 'boolean' && value !== internalChecked) {
        setInternalChecked(value);
      }
    }, [internalChecked, isControlled]);

    return (
      <Wrapper className={className} style={style}>
        <Label id={labelId} htmlFor={inputId} $disabled={disabled}>
          <CheckboxControl>
            <HiddenInput
              {...rest}
              id={inputId}
              ref={(node) => {
                inputRef.current = node;
                if (typeof ref === 'function') {
                  ref(node);
                } else if (ref) {
                  ref.current = node;
                }
              }}
              type="checkbox"
              name={name}
              checked={isChecked}
              defaultChecked={undefined}
              disabled={disabled}
              $disabled={disabled}
              onChange={(event) => {
                if (!isControlled) {
                  setInternalChecked(event.target.checked);
                }

                onChange?.(event);
              }}
              aria-labelledby={labelId}
              aria-describedby={describedBy || undefined}
              aria-invalid={!!error || undefined}
            />
            <CheckboxVisual $checked={isChecked} $disabled={disabled} $error={!!error}>
              <Checkmark />
            </CheckboxVisual>
          </CheckboxControl>
          <LabelText>{children || label}</LabelText>
        </Label>
        {hasInfo && (
          <InputInfo id={infoMessageId} role="status" aria-live="polite" $isError={false}>
            <Info />
            {info}
          </InputInfo>
        )}
        {hasError && (
          <InputInfo id={errorMessageId} role="alert" aria-live="assertive" $isError>
            <Info />
            {error}
          </InputInfo>
        )}
      </Wrapper>
    );
  }
);

Checkbox.displayName = 'Checkbox';
