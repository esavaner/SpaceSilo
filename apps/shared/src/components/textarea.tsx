import { forwardRef, useId } from 'react';
import styled from 'styled-components';
import { InfoIcon } from '../assets/icons';
import {
  commonInputStyles,
  InputInfo,
  InputLabel,
  inputStateStyles,
  InputContainer,
  InputWrapper,
  type InputInfoProps,
} from './input';

const StyledTextarea = styled.textarea<InputInfoProps>`
  ${commonInputStyles}
  ${inputStateStyles}
  
  min-height: 132px;
  resize: vertical;
`;

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  hideLabel?: boolean;
  info?: string;
  error?: string;
  wrapperStyle?: React.CSSProperties;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ id, name, label, hideLabel, info, error, placeholder, required, disabled, wrapperStyle, ...props }, ref) => {
    const inputId = id || name || `textarea-${useId().replace(/:/g, '')}`;
    const labelId = `${inputId}-label`;
    const infoMessageId = `${inputId}-info`;
    const errorMessageId = `${inputId}-error`;
    const hasInfo = !!info && !disabled;
    const hasError = !!error && !disabled;
    const describedBy = [hasInfo ? infoMessageId : undefined, hasError ? errorMessageId : undefined]
      .filter(Boolean)
      .join(' ');

    return (
      <InputWrapper style={wrapperStyle}>
        {!hideLabel && (
          <InputLabel id={labelId} htmlFor={inputId}>
            {label}
            {required && <span style={{ color: 'var(--text-status-danger-default)' }}>*</span>}
          </InputLabel>
        )}
        <InputContainer>
          <StyledTextarea
            id={inputId}
            ref={ref}
            name={name}
            placeholder={placeholder || label}
            required={required}
            disabled={disabled}
            aria-labelledby={!hideLabel ? labelId : undefined}
            aria-label={hideLabel ? label : undefined}
            aria-describedby={describedBy || undefined}
            aria-invalid={!!error || undefined}
            $isError={!!error}
            $disabled={disabled}
            {...props}
          />
          {hasInfo && (
            <InputInfo id={infoMessageId} role="status" aria-live="polite">
              <InfoIcon />
              {info}
            </InputInfo>
          )}
          {hasError && (
            <InputInfo id={errorMessageId} role="alert" aria-live="assertive" $isError>
              <InfoIcon />
              {error}
            </InputInfo>
          )}
        </InputContainer>
      </InputWrapper>
    );
  }
);

Textarea.displayName = 'Textarea';
