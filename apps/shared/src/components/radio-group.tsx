import { Children, ReactElement, ReactNode, cloneElement, useId } from 'react';
import styled from 'styled-components';
import { Info } from '../assets/icons';
import { theme } from '../config/theme';
import { RadioProps } from './radio';
import { InputInfo } from './input';

const Group = styled.fieldset`
  border: 0;
  display: grid;
  gap: var(--spacing-400);
`;

const Legend = styled.legend`
  ${theme.text.L}
  margin-bottom: var(--spacing-400);
  width: 100%;
`;

type RadioGroupProps = React.HTMLAttributes<HTMLFieldSetElement> & {
  name: string;
  legend?: ReactNode;
  error?: string;
};

export const RadioGroup = ({ id, name, legend, children, error, ...rest }: RadioGroupProps) => {
  const groupId = id || `radio-group-${useId().replace(/:/g, '')}`;
  const legendId = `${groupId}-legend`;
  const messageId = `${groupId}-message`;
  const isError = !!error;

  return (
    <Group
      id={groupId}
      role="radiogroup"
      aria-labelledby={legendId}
      aria-invalid={isError || undefined}
      aria-describedby={isError ? messageId : undefined}
      {...rest}
    >
      {legend && <Legend id={legendId}>{legend}</Legend>}
      {Children.map(children, (child) => {
        const radioChild = child as ReactElement<RadioProps>;
        const describedBy = radioChild.props['aria-describedby'];

        return cloneElement(radioChild, {
          name: radioChild.props.name || name,
          'aria-describedby': isError ? (describedBy ? `${describedBy} ${messageId}` : messageId) : describedBy,
          'aria-invalid': isError || undefined,
        });
      })}
      {isError && (
        <InputInfo id={messageId} $isError role="alert" aria-live="assertive" style={{ paddingTop: 2 }}>
          <Info />
          {error}
        </InputInfo>
      )}
    </Group>
  );
};
