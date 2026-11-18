import styled from 'styled-components';
import { css } from 'styled-components';
import { theme } from '../config/theme';
import { Text } from './text';
import { Info } from '../assets/icons';
import { forwardRef, JSX, useId } from 'react';

export type InputInfoProps = {
  $isError?: boolean;
  $hasIcon?: boolean;
  $hasIconLeft?: boolean;
  $disabled?: boolean;
  $customInputDefaultStyle?: boolean;
};

export const InputWrapper = styled.div`
  display: grid;
`;
export const InputLabel = styled(Text.FormLabel)`
  display: flex;
  gap: var(--spacing-50);
  padding-bottom: var(--spacing-100);
  padding-left: var(--spacing-150);
  width: fit-content;
`;
export const InputContainer = styled.div`
  position: relative;
  border-radius: var(--border-radius-300);
  background: var(--fill-surface-weak);
`;
const Icon = styled.div<{ $left?: boolean }>`
  position: absolute;
  top: 25px;
  transform: translateY(-50%);
  color: var(--icon-secondary-default);
  pointer-events: none;

  ${({ $left }) =>
    $left
      ? css`
          left: var(--spacing-400);
        `
      : css`
          right: var(--spacing-400);
        `}

  & > svg {
    display: block;
  }
`;
export const commonInputStyles = css<InputInfoProps>`
  ${theme.text.formPlaceholder}
  width: 100%;
  padding: var(--spacing-300) var(--spacing-400);
  padding-right: ${({ $hasIcon }) => ($hasIcon ? 'var(--spacing-1200)' : 'var(--spacing-400)')};
  padding-left: ${({ $hasIconLeft }) => ($hasIconLeft ? 'var(--spacing-1200)' : 'var(--spacing-400)')};
  border-radius: var(--border-radius-300);
  background-color: ${({ $disabled }) =>
    $disabled ? 'var(--fill-controls-disabled-disabled)' : 'var(--fill-surface-weak)'};
  border: 1px solid
    ${({ $isError }) => ($isError ? 'var(--text-status-danger-default)' : 'var(--border-input-default)')};
  cursor: pointer;
`;
export const inputStateStyles = css`
  &:hover:not(:disabled) {
    border: 1px solid var(--border-input-hover);
    box-shadow: 0 0 0 4px #f5f2ef;
  }
  &:active:not(:disabled),
  &:focus:not(:disabled) {
    border: 1px solid var(--border-input-active);
    outline: none;
  }
  &:disabled {
    background-color: var(--fill-controls-disabled-disabled);
    border: 1px solid var(--border-controls-disabled-disabled);
    color: var(--text-disabled-disabled);
    cursor: not-allowed;
  }
`;
const StyledInput = styled.input<InputInfoProps>`
  ${commonInputStyles}
  ${inputStateStyles}
`;
const CustomInputWrapper = styled.div<InputInfoProps>`
  ${({ $customInputDefaultStyle, $disabled }) =>
    $customInputDefaultStyle
      ? ''
      : css`
          ${commonInputStyles}
          padding-top: var(--spacing-100);
          padding-bottom: 0;
          ${
            !$disabled &&
            css`
              &:hover {
                border: 1px solid var(--border-input-hover);
                box-shadow: 0 0 0 4px #f5f2ef;
              }
              &:focus-within {
                border: 1px solid var(--border-input-active);
              }
            `
          }
        `}
`;
export const InputInfo = styled(Text.FormMessage)<InputInfoProps>`
  display: flex;
  gap: var(--spacing-100);
  padding: var(--spacing-150);
  padding-bottom: 0;
  color: ${({ $isError }) => ($isError ? 'var(--text-status-danger-default)' : 'var(--text-secondary-default)')};
  * {
    flex-shrink: 0;
  }
  &:last-child {
    padding-bottom: var(--spacing-150);
  }
`;

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hideLabel?: boolean;
  info?: string;
  error?: string;
  icon?: JSX.Element;
  iconComponent?: JSX.Element;
  leftIcon?: JSX.Element;
  leftIconComponent?: JSX.Element;
  customInput?: JSX.Element;
  customInputDefaultStyle?: boolean;
  wrapperStyle?: React.CSSProperties;
  wrapperOnClick?: React.MouseEventHandler<HTMLDivElement>;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      hideLabel,
      info,
      error,
      icon,
      iconComponent,
      leftIcon,
      leftIconComponent,
      customInput,
      customInputDefaultStyle = false,
      wrapperStyle,
      wrapperOnClick,
      // Input HTML attributes
      id,
      name,
      label,
      placeholder,
      required,
      disabled,
      onClick,
      ...props
    },
    ref
  ) => {
    const inputId = id || name || `input-${useId().replace(/:/g, '')}`;
    const labelId = `${inputId}-label`;
    const infoMessageId = `${inputId}-info`;
    const errorMessageId = `${inputId}-error`;
    const hasInfo = !!info && !disabled;
    const hasError = !!error && !disabled;
    const describedBy = [hasInfo ? infoMessageId : undefined, hasError ? errorMessageId : undefined]
      .filter(Boolean)
      .join(' ');
    const isError = !!error;
    const hasIcon = !!icon || !!iconComponent;
    const hasLeftIcon = !!leftIcon || !!leftIconComponent;

    const inputProps = {
      id: inputId,
      ref,
      name,
      required,
      disabled,
      onClick: (e: React.MouseEvent<HTMLInputElement>) => {
        e.stopPropagation();
        onClick?.(e);
      },
      placeholder: placeholder || label,
      'aria-labelledby': !hideLabel ? labelId : undefined,
      'aria-label': hideLabel ? label : undefined,
      'aria-describedby': describedBy || undefined,
      'aria-invalid': isError || undefined,
      $isError: isError,
      $hasIcon: hasIcon,
      $hasIconLeft: hasLeftIcon,
      ...props,
    };

    return (
      <InputWrapper style={wrapperStyle} onClick={wrapperOnClick || onClick}>
        {!hideLabel && (
          <InputLabel id={labelId} htmlFor={customInput ? undefined : inputId}>
            {label}
            {required && <span style={{ color: 'var(--text-status-danger-default)' }}>*</span>}
          </InputLabel>
        )}
        <InputContainer>
          {leftIconComponent ? leftIconComponent : leftIcon && <Icon $left>{leftIcon}</Icon>}
          {customInput ? (
            <CustomInputWrapper
              {...inputProps}
              role="group"
              $disabled={disabled}
              $customInputDefaultStyle={customInputDefaultStyle}
            >
              {customInput}
            </CustomInputWrapper>
          ) : (
            <StyledInput {...inputProps} />
          )}
          {iconComponent ? iconComponent : icon && <Icon>{icon}</Icon>}
          {hasInfo && (
            <InputInfo id={infoMessageId} role="status" aria-live="polite">
              <Info />
              {info}
            </InputInfo>
          )}
          {hasError && (
            <InputInfo id={errorMessageId} $isError role="alert" aria-live="assertive">
              <Info />
              {error}
            </InputInfo>
          )}
        </InputContainer>
      </InputWrapper>
    );
  }
);

Input.displayName = 'Input';

export const InputIconButton = styled.button`
  position: absolute;
  height: fit-content;
  top: 25px;
  transform: translateY(-50%);
  border-radius: var(--border-radius-100);
  right: var(--spacing-400);
  display: inline-flex;
  color: var(--icon-secondary-default);
  padding: 0;
  & > svg {
    display: block;
  }
  &:hover:not(:disabled) {
    background-color: rgba(0, 0, 0, 0.05);
  }
  &:disabled {
    color: var(--text-disabled-disabled);
    cursor: not-allowed;
  }
  &:focus,
  &:focus-visible {
    outline: 2px solid var(--border-input-active);
    border-radius: var(--border-radius-100);
  }
`;
