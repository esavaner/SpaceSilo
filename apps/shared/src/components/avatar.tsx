import { Image, type PressableProps } from 'react-native';
import styled from 'styled-components/native';
import { theme } from '../config/theme';
import { Text } from './text';

type Props = PressableProps & {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
};

const dimensions = { sm: 32, md: 48, lg: 80 } as const;

const Container = styled.Pressable<{ $size: keyof typeof dimensions; $color?: string }>`
  width: ${({ $size }) => dimensions[$size]}px;
  height: ${({ $size }) => dimensions[$size]}px;
  border-radius: ${theme.radius.full};
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background-color: ${({ $color }) => $color ?? theme.colors.surface.stronger};
`;

export const getInitials = (name?: string) => {
  if (!name) return 'N/A';
  const [first, last] = name.split(' ');
  if (!first || !last) return first ? first.charAt(0).toUpperCase() : '';
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
};

export const Avatar = ({ src, alt, color, size = 'md', onPress = () => {}, ...rest }: Props) => (
  <Container $size={size} $color={color} onPress={onPress} {...rest}>
    {src ? (
      <Image source={{ uri: src }} alt={alt} style={{ width: '100%', height: '100%' }} />
    ) : size === 'lg' ? (
      <Text.H1>{getInitials(alt)}</Text.H1>
    ) : size === 'md' ? (
      <Text.H3>{getInitials(alt)}</Text.H3>
    ) : (
      <Text>{getInitials(alt)}</Text>
    )}
  </Container>
);
