import {
  Children,
  cloneElement,
  isValidElement,
  useId,
  useState,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import { Platform, type ViewProps } from 'react-native';
import styled from 'styled-components/native';
import { Info } from '../assets/icons';
import { theme } from '../config/theme';
import { type RadioProps } from './radio';
import { InputInfo } from './input';

const Group = styled.View<{ className?: string }>`
  gap: ${theme.spacing[400]};
`;

const Legend = styled.Text`
  ${theme.text.L}
  color: ${theme.colors.text.default};
  width: 100%;
`;

type RadioGroupProps = ViewProps &
  Pick<RadioProps, 'aria-describedby' | 'aria-invalid'> & {
    className?: string;
    name: string;
    legend?: ReactNode;
    error?: string;
  };

export const RadioGroup = ({ id, nativeID, name, legend, children, error, ...rest }: RadioGroupProps) => {
  const generatedId = useId();
  const groupId = id || nativeID || `radio-group-${generatedId.replace(/:/g, '')}`;
  const legendId = `${groupId}-legend`;
  const messageId = `${groupId}-message`;
  const isError = !!error;
  const items = Children.toArray(children);
  const radios = items.filter((child): child is ReactElement<RadioProps> => isValidElement<RadioProps>(child));
  const [selectedKey, setSelectedKey] = useState(() => radios.find((child) => child.props.defaultChecked)?.key ?? null);
  const isChecked = (child: ReactElement<RadioProps>) => child.props.checked ?? child.key === selectedKey;
  const tabStop =
    radios.find((child) => !child.props.disabled && isChecked(child)) ?? radios.find((child) => !child.props.disabled);

  return (
    <Group
      {...rest}
      nativeID={groupId}
      role="radiogroup"
      aria-labelledby={legend != null ? legendId : rest['aria-labelledby']}
      aria-invalid={isError || rest['aria-invalid']}
      aria-describedby={[rest['aria-describedby'], isError && messageId].filter(Boolean).join(' ') || undefined}
      {...(Platform.OS === 'web'
        ? {
            onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
              const direction =
                event.key === 'ArrowRight' || event.key === 'ArrowDown'
                  ? 1
                  : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
                    ? -1
                    : 0;
              if (!direction) return;

              const enabled = Array.from(
                event.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]:not([aria-disabled="true"])')
              );
              const index = enabled.findIndex((radio) => radio === event.target);
              if (index < 0) return;

              event.preventDefault();
              const next = enabled[(index + direction + enabled.length) % enabled.length];
              if (next) {
                next.focus();
                next.click();
              }
            },
          }
        : {})}
    >
      {legend != null && <Legend nativeID={legendId}>{legend}</Legend>}
      {items.map((child) => {
        if (!isValidElement<RadioProps>(child)) return child;
        const describedBy = child.props['aria-describedby'];

        return cloneElement(child, {
          name: child.props.name || name,
          checked: isChecked(child),
          error: child.props.error || error,
          onValueChange: (checked) => {
            if (checked) setSelectedKey(child.key);
            child.props.onValueChange?.(checked);
          },
          ...(Platform.OS === 'web' ? { tabIndex: child === tabStop ? 0 : -1 } : {}),
          'aria-describedby': isError ? (describedBy ? `${describedBy} ${messageId}` : messageId) : describedBy,
          'aria-invalid': isError || child.props['aria-invalid'],
        });
      })}
      {isError && (
        <InputInfo nativeID={messageId} $isError role="alert" aria-live="assertive" style={{ paddingTop: 2 }}>
          <Info color={theme.colors.text.danger} />
          {error}
        </InputInfo>
      )}
    </Group>
  );
};
