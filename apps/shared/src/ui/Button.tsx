import type { ComponentProps } from 'react';
import { Pressable } from 'react-native';
import styled from 'styled-components/native';

const ButtonRoot = styled(Pressable)`
  min-height: 44px;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  border-radius: 8px;
  background-color: #0070f3;
  opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};

  &:active {
    opacity: 0.8;
  }
`;

const ButtonLabel = styled.Text`
  color: #171717;
  font-size: 16px;
  font-weight: 500;
`;

export type ButtonProps = Omit<ComponentProps<typeof Pressable>, 'children'> & {
  children: string;
};

export function Button({ children, ...props }: ButtonProps) {
  return (
    <ButtonRoot accessibilityRole="button" {...props}>
      <ButtonLabel>{children}</ButtonLabel>
    </ButtonRoot>
  );
}
