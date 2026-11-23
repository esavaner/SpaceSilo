import { forwardRef } from 'react';
import { View, type ViewProps } from 'react-native';
import styled from 'styled-components/native';
import { theme } from '../config/theme';

type Dimension = number | `${number}%`;

const Placeholder = styled.View`
  overflow: hidden;
  border: ${theme.borderWeight[25]} solid ${theme.colors.border.default};
  background-color: ${theme.colors.surface.stronger};
`;

type Props = Omit<ViewProps, 'children'> & {
  circle?: boolean;
  height?: Dimension;
  width?: Dimension;
};

export const Skeleton = forwardRef<View, Props>(
  ({ circle = false, height = 16, width = '100%', style, ...rest }, ref) => (
    <Placeholder
      {...rest}
      ref={ref}
      accessible={false}
      aria-hidden
      pointerEvents="none"
      style={[
        {
          borderRadius: Number.parseFloat(circle ? theme.radius.full : theme.radius[200]),
          height,
          width,
        },
        style,
      ]}
    />
  )
);

Skeleton.displayName = 'Skeleton';
