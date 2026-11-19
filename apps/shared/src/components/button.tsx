import styled, { css } from 'styled-components';
import { theme } from '../config/theme';
import { Loader } from './loader';

type Variant = 'primary' | 'secondary' | 'tertiary' | 'destructive' | 'link';
type Size = 'small' | 'medium' | 'large';

type StyleProps = {
  default: ReturnType<typeof css>;
  hover: ReturnType<typeof css>;
  clicked: ReturnType<typeof css>;
};

const styles: Record<Variant, StyleProps> = {
  primary: {
    default: css`
      color: ${theme.colors.text.inverted};
      background: ${theme.colors.primary.default};
      border: 1px solid ${theme.colors.border.primary.default};
    `,
    hover: css`
      color: ${theme.colors.text.inverted};
      background: ${theme.colors.primary.hover};
      border: 1px solid ${theme.colors.border.primary.hover};
      box-shadow: 0 0 0 4px #e7f1e9;
    `,
    clicked: css`
      color: ${theme.colors.text.inverted};
      background: ${theme.colors.primary.active};
      border: 1px solid ${theme.colors.border.primary.active};
      outline: 1px solid ${theme.colors.border.primary.active};
      outline-offset: 4px;
    `,
  },
  secondary: {
    default: css`
      color: ${theme.colors.text.default};
      background: ${theme.colors.secondary.default};
      border: 1px solid ${theme.colors.border.secondary.default};
    `,
    hover: css`
      color: ${theme.colors.text.default};
      background: ${theme.colors.secondary.hover};
      border: 1px solid ${theme.colors.border.secondary.hover};
    `,
    clicked: css`
      color: ${theme.colors.text.default};
      background: ${theme.colors.secondary.active};
      border: 1px solid ${theme.colors.border.secondary.active};
      outline: 1px solid ${theme.colors.border.secondary.active};
      outline-offset: 4px;
    `,
  },
  tertiary: {
    default: css`
      color: ${theme.colors.text.brand};
      background: ${theme.colors.tertiary.default};
      border: 1px solid transparent;
    `,
    hover: css`
      color: ${theme.colors.text.brand};
      background: ${theme.colors.tertiary.hover};
      border: 1px solid transparent;
    `,
    clicked: css`
      color: ${theme.colors.text.brand};
      background: ${theme.colors.tertiary.active};
      border: 1px solid transparent;
    `,
  },
  destructive: {
    default: css`
      color: ${theme.colors.text.inverted};
      background: ${theme.colors.destructive.default};
      border: 1px solid ${theme.colors.border.destructive.default};
    `,
    hover: css`
      color: ${theme.colors.text.inverted};
      background: ${theme.colors.destructive.hover};
      border: 1px solid ${theme.colors.border.destructive.hover};
    `,
    clicked: css`
      color: ${theme.colors.text.inverted};
      background: ${theme.colors.destructive.active};
      border: 1px solid ${theme.colors.border.destructive.active};
      outline: 1px solid ${theme.colors.border.destructive.active};
      outline-offset: 4px;
    `,
  },
  link: {
    default: css`
      color: ${theme.colors.text.default};
      background: transparent;
      border: 1px solid transparent;
      text-decoration: underline;
    `,
    hover: css`
      color: ${theme.colors.text.default};
      background: ${theme.colors.tertiary.hover};
      border: 1px solid transparent;
      text-decoration: underline;
    `,
    clicked: css`
      color: ${theme.colors.text.default};
      background: ${theme.colors.tertiary.active};
      border: 1px solid transparent;
      text-decoration: underline;
    `,
  },
};

type StyledProps = {
  $variant: Variant;
  $size: Size;
  $disabled?: boolean;
};

const StyledButton = styled.button<StyledProps>`
  ${theme.text.button}
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${theme.spacing[200]};
  font-weight: bold;
  cursor: pointer;
  position: relative;
  outline: 1px solid transparent;
  outline-offset: 4px;
  ${({ $variant }) => styles[$variant].default}
  *,
  & {
    transition:
      color 0.15s ease,
      background-color 0.15s ease,
      border-color 0.15s ease,
      box-shadow 0.15s ease,
      outline-color 0.01s ease 0.1s;
  }

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
            border: 1px solid transparent;
          `
        : css`
            color: ${theme.colors.text.disabled};
            background: ${theme.colors.disabled};
            border: 1px solid ${theme.colors.disabled};
          `
      : ''} 

  &:disabled {
    cursor: not-allowed;
  }
  &:hover:not(:disabled):not(:active):not(:focus-visible) {
    ${({ $variant }) => styles[$variant].hover}
  }
  &:active:not(:disabled),
  &:focus-visible:not(:disabled) {
    ${({ $variant }) => styles[$variant].clicked}
  }
`;

const SpinnerWrapper = styled.span<{ $active: boolean }>`
  overflow: hidden;
  height: 1.125rem;
  transition: all 0.2s cubic-bezier(0.645, 0.045, 0.355, 1);
  &,
  * {
    color: inherit;
    stroke: currentColor;
  }
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

type CommonProps = {
  variant?: Variant;
  loading?: boolean;
  children?: React.ReactNode;
  size?: Size;
  center?: boolean;
};

type ButtonProps = CommonProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
  };

type AnchorProps = CommonProps &
  React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
  };

type Props = ButtonProps | AnchorProps;

export const Button = ({ variant = 'primary', loading, size = 'medium', children, center, style, ...props }: Props) => {
  const { href, disabled } = props as AnchorProps & ButtonProps;
  const component = href != null ? 'a' : undefined;

  return (
    <StyledButton
      {...(props as React.ComponentProps<typeof StyledButton>)}
      as={component as never}
      $variant={variant}
      $size={size}
      $disabled={disabled}
      disabled={component === undefined ? disabled || loading : undefined}
      style={center ? { ...style, alignSelf: 'center' } : style}
    >
      <SpinnerWrapper $active={!!loading}>
        <Loader />
      </SpinnerWrapper>
      {children}
    </StyledButton>
  );
};
