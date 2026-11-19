import { Children, useState, type KeyboardEventHandler, type MouseEventHandler, type ReactNode } from 'react';
import { ActivityIndicator, Platform, type GestureResponderEvent, type PressableProps } from 'react-native';
import styled, { css } from 'styled-components/native';
import { theme } from '../config/theme';

type Variant = 'primary' | 'secondary' | 'tertiary' | 'destructive' | 'link';
type Size = 'small' | 'medium' | 'large';

type StyleProps = {
  default: ReturnType<typeof css>;
  hover: ReturnType<typeof css>;
  clicked: ReturnType<typeof css>;
};

// RN views reject CSS outline strings, so the focus ring stays web-only.
const webOutline = (color: string) =>
  Platform.OS === 'web'
    ? css`
        outline: 1px solid ${color};
        outline-offset: 4px;
      `
    : '';

const styles: Record<Variant, StyleProps> = {
  primary: {
    default: css`
      color: ${theme.colors.text.inverted};
      background: ${theme.colors.primary.default};
      border-color: ${theme.colors.border.primary.default};
    `,
    hover: css`
      color: ${theme.colors.text.inverted};
      background: ${theme.colors.primary.hover};
      border-color: ${theme.colors.border.primary.hover};
      box-shadow: 0 0 0 4px #e7f1e9;
    `,
    clicked: css`
      color: ${theme.colors.text.inverted};
      background: ${theme.colors.primary.active};
      border-color: ${theme.colors.border.primary.active};
      ${webOutline(theme.colors.border.primary.active)}
    `,
  },
  secondary: {
    default: css`
      color: ${theme.colors.text.default};
      background: ${theme.colors.secondary.default};
      border-color: ${theme.colors.border.secondary.default};
    `,
    hover: css`
      color: ${theme.colors.text.default};
      background: ${theme.colors.secondary.hover};
      border-color: ${theme.colors.border.secondary.hover};
    `,
    clicked: css`
      color: ${theme.colors.text.default};
      background: ${theme.colors.secondary.active};
      border-color: ${theme.colors.border.secondary.active};
      ${webOutline(theme.colors.border.secondary.active)}
    `,
  },
  tertiary: {
    default: css`
      color: ${theme.colors.text.brand};
      background: ${theme.colors.tertiary.default};
      border-color: transparent;
    `,
    hover: css`
      color: ${theme.colors.text.brand};
      background: ${theme.colors.tertiary.hover};
      border-color: transparent;
    `,
    clicked: css`
      color: ${theme.colors.text.brand};
      background: ${theme.colors.tertiary.active};
      border-color: transparent;
    `,
  },
  destructive: {
    default: css`
      color: ${theme.colors.text.inverted};
      background: ${theme.colors.destructive.default};
      border-color: ${theme.colors.border.destructive.default};
    `,
    hover: css`
      color: ${theme.colors.text.inverted};
      background: ${theme.colors.destructive.hover};
      border-color: ${theme.colors.border.destructive.hover};
    `,
    clicked: css`
      color: ${theme.colors.text.inverted};
      background: ${theme.colors.destructive.active};
      border-color: ${theme.colors.border.destructive.active};
      ${webOutline(theme.colors.border.destructive.active)}
    `,
  },
  link: {
    default: css`
      color: ${theme.colors.text.default};
      background: transparent;
      border-color: transparent;
      text-decoration: underline;
    `,
    hover: css`
      color: ${theme.colors.text.default};
      background: ${theme.colors.tertiary.hover};
      border-color: transparent;
      text-decoration: underline;
    `,
    clicked: css`
      color: ${theme.colors.text.default};
      background: ${theme.colors.tertiary.active};
      border-color: transparent;
      text-decoration: underline;
    `,
  },
};

type ButtonAttributes = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'children' | 'style' | 'onClick' | 'onKeyDown' | 'disabled' | keyof PressableProps
>;
type AnchorAttributes = Omit<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  'children' | 'style' | 'onClick' | 'onKeyDown' | 'href' | 'disabled' | keyof PressableProps
>;
type WebProps = {
  onClick?: MouseEventHandler<HTMLElement>;
  onKeyDown?: KeyboardEventHandler<HTMLElement>;
};

type CommonProps = {
  variant?: Variant;
  loading?: boolean;
  children?: ReactNode;
  size?: Size;
  center?: boolean;
  className?: string;
} & Omit<PressableProps, 'children' | 'style'> &
  WebProps & {
    style?: PressableProps['style'];
  };

type ButtonProps = CommonProps & ButtonAttributes & { href?: undefined };
type AnchorProps = CommonProps & AnchorAttributes & { href: string };
type Props = ButtonProps | AnchorProps;

type StyledProps = {
  $variant: Variant;
  $size: Size;
  $disabled?: boolean;
  $isActive?: boolean;
  children?: ReactNode;
  style?: PressableProps['style'];
  className?: string;
} & Omit<PressableProps, 'children' | 'style'> &
  WebProps & {
    href?: string;
    target?: string;
    rel?: string;
    download?: string | boolean;
    hrefAttrs?: { target?: string; rel?: string; download?: string | boolean };
    type?: string;
    name?: string;
    value?: string | number | readonly string[];
    form?: string;
    tabIndex?: number;
  };

const StyledButton = styled.Pressable<StyledProps>`
  ${theme.text.button}
  flex-direction: row;
  align-items: center;
  justify-content: center;
  align-self: flex-start;
  gap: ${theme.spacing[200]};
  font-weight: bold;
  position: relative;
  border-width: 1px;
  ${webOutline('transparent')}
  ${({ $variant }) => styles[$variant].default}

  ${({ $size }) =>
    $size === 'large'
      ? css`
          padding: ${theme.spacing[300]} ${theme.spacing[600]};
          border-radius: ${theme.radius[300]};
        `
      : $size === 'small'
        ? css`
            padding: ${theme.spacing[150]} ${theme.spacing[300]};
            border-radius: ${theme.radius[200]};
            font-size: ${theme.fontSize.sm};
            line-height: 145%;
            letter-spacing: 0.01875rem;
          `
        : css`
            padding: ${theme.spacing[200]} ${theme.spacing[400]};
            border-radius: ${theme.radius[300]};
          `}

  ${({ $disabled, $variant }) =>
    $disabled
      ? $variant === 'tertiary' || $variant === 'link'
        ? css`
            color: ${theme.colors.text.disabled};
            background: transparent;
            border-color: transparent;
          `
        : css`
            color: ${theme.colors.text.disabled};
            background: ${theme.colors.disabled};
            border-color: ${theme.colors.disabled};
          `
      : ''}

  ${({ $variant }) =>
    Platform.OS === 'web' &&
    css`
      cursor: pointer;
      transition:
        color 0.15s ease,
        background-color 0.15s ease,
        border-color 0.15s ease,
        box-shadow 0.15s ease,
        outline-color 0.01s ease 0.1s;

      &:disabled {
        cursor: not-allowed;
      }

      &:hover:not(:disabled):not(:active):not(:focus-visible) {
        ${styles[$variant].hover}
      }

      &:active:not(:disabled),
      &:focus-visible:not(:disabled) {
        ${styles[$variant].clicked}
      }
    `}

  ${({ $disabled, $isActive, $variant }) =>
    !$disabled && Platform.OS !== 'web' && $isActive ? styles[$variant].clicked : ''}
`;

const ButtonText = styled.Text<{ $color: string; $size: Size }>`
  ${theme.text.button}
  color: ${({ $color }) => $color};
  ${({ $size }) =>
    $size === 'small' &&
    css`
      font-size: ${theme.fontSize.sm};
      line-height: 145%;
      letter-spacing: 0.01875rem;
    `}
`;

const SpinnerWrapper = styled.View<{ $active: boolean }>`
  overflow: hidden;
  height: 1.125rem;
  align-items: center;
  justify-content: center;
  transition: all 0.2s cubic-bezier(0.645, 0.045, 0.355, 1);
  ${({ $active }) =>
    $active
      ? css`
          margin-left: 0;
          width: 1.125rem;
        `
      : css`
          margin-left: -0.5rem;
          width: 0;
        `}
`;

export const Button = ({
  variant = 'primary',
  loading,
  size = 'medium',
  children,
  center,
  style,
  href,
  disabled,
  onFocus,
  onBlur,
  onPressIn,
  onPressOut,
  onPress,
  onClick,
  onKeyDown,
  ...props
}: Props) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const textColor = disabled
    ? theme.colors.text.disabled
    : variant === 'primary' || variant === 'destructive'
      ? theme.colors.text.inverted
      : variant === 'tertiary'
        ? theme.colors.text.brand
        : theme.colors.text.default;
  const buttonStyle: PressableProps['style'] =
    center || typeof style === 'function'
      ? (state) => [typeof style === 'function' ? style(state) : style, center ? { alignSelf: 'center' } : undefined]
      : style;
  const handlePress = (event: GestureResponderEvent) => {
    onPress?.(event);
    if (Platform.OS === 'web') {
      onClick?.(event as unknown as React.MouseEvent<HTMLElement>);
    }
  };

  return (
    <StyledButton
      {...props}
      href={Platform.OS === 'web' ? href : undefined}
      hrefAttrs={
        Platform.OS === 'web' && href
          ? {
              target: 'target' in props ? props.target : undefined,
              rel: 'rel' in props ? props.rel : undefined,
              download: 'download' in props ? props.download : undefined,
            }
          : undefined
      }
      $variant={variant}
      $size={size}
      $disabled={!!disabled}
      $isActive={isFocused || isPressed}
      disabled={href === undefined ? !!disabled || !!loading : !!disabled}
      onPress={handlePress}
      onKeyDown={Platform.OS === 'web' ? onKeyDown : undefined}
      accessibilityRole={href ? 'link' : 'button'}
      accessibilityState={{ disabled: !!disabled || (!!loading && href === undefined), busy: !!loading }}
      style={buttonStyle}
      onFocus={(event) => {
        if (Platform.OS !== 'web') setIsFocused(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        if (Platform.OS !== 'web') setIsFocused(false);
        onBlur?.(event);
      }}
      onPressIn={(event) => {
        if (Platform.OS !== 'web') setIsPressed(true);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        if (Platform.OS !== 'web') setIsPressed(false);
        onPressOut?.(event);
      }}
    >
      <SpinnerWrapper $active={!!loading} accessibilityElementsHidden={!loading} aria-hidden={!loading}>
        {loading && <ActivityIndicator size={18} color={textColor} />}
      </SpinnerWrapper>
      {Children.map(children, (child) =>
        typeof child === 'string' || typeof child === 'number' ? (
          <ButtonText $color={textColor} $size={size}>
            {child}
          </ButtonText>
        ) : (
          child
        )
      )}
    </StyledButton>
  );
};
