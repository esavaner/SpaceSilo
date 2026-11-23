import type { ReactNode } from 'react';
import type { ViewProps } from 'react-native';
import styled from 'styled-components/native';
import { theme } from '../config/theme';
import { Text } from './text';

type StyledProps = {
  $bordered: boolean;
  $center: boolean;
};

const Container = styled.View<StyledProps>`
  align-items: ${({ $center }) => ($center ? 'center' : 'flex-start')};
  gap: ${theme.spacing[300]};
  padding: ${theme.spacing[600]};
  border-width: ${({ $bordered }) => ($bordered ? theme.borderWeight[25] : '0px')};
  border-style: dashed;
  border-color: ${theme.colors.border.default};
  border-radius: ${theme.radius[400]};
`;

const IconWrapper = styled.View`
  margin-bottom: ${theme.spacing[100]};
`;

const ActionWrapper = styled.View`
  margin-top: ${theme.spacing[100]};
`;

type Props = Omit<ViewProps, 'children'> & {
  action?: ReactNode;
  bordered?: boolean;
  center?: boolean;
  description?: ReactNode;
  icon?: ReactNode;
  title?: ReactNode;
};

export const EmptyState = ({ action, bordered = true, center = true, description, icon, title, ...rest }: Props) => (
  <Container {...rest} $bordered={bordered} $center={center}>
    {icon ? <IconWrapper>{icon}</IconWrapper> : null}
    {title ? (
      typeof title === 'string' || typeof title === 'number' ? (
        <Text.H3 center={center}>{title}</Text.H3>
      ) : (
        title
      )
    ) : null}
    {description ? (
      typeof description === 'string' || typeof description === 'number' ? (
        <Text.M center={center} color={theme.colors.text.secondary}>
          {description}
        </Text.M>
      ) : (
        description
      )
    ) : null}
    {action ? <ActionWrapper>{action}</ActionWrapper> : null}
  </Container>
);
