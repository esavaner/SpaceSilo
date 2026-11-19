import { forwardRef } from 'react';
import { Text as NativeText } from 'react-native';
import styled, { css, RuleSet } from 'styled-components/native';
import { theme } from '../config/theme';
import { CircleImage, UnderlineImage } from '../assets/images';

type EmVariant = 'primary' | 'underline' | 'circle' | 'divider';

type ComponentProps = {
  color?: string;
  italic?: boolean;
  weight?: number;
  center?: boolean;
  em?: EmVariant;
};
type StyledProps = {
  [key in keyof ComponentProps as `$${key}`]: ComponentProps[key];
};
type TextProps = Omit<React.ComponentPropsWithoutRef<typeof NativeText>, 'color'> & ComponentProps;

const emStyles: Record<EmVariant, RuleSet<object>> = {
  primary: css`
    color: ${theme.colors.text.brand};
    font-style: italic;
  `,
  underline: css`
    flex-shrink: 0;
    position: relative;
    font-style: italic;
    width: fit-content;
    z-index: ${theme.zIndex.base};
    &::before {
      z-index: ${theme.zIndex.below};
      content: '';
      bottom: -25px;
      left: 0;
      right: 0;
      height: 50px;
      position: absolute;
      background-position: center;
      background-size: contain;
      background-repeat: no-repeat;
      background-image: url(${UnderlineImage});
      pointer-events: none;
    }
  `,
  circle: css`
    position: relative;
    font-style: italic;
    width: fit-content;
    z-index: ${theme.zIndex.base};
    &::before {
      z-index: ${theme.zIndex.below};
      content: '';
      left: -10%;
      right: -10%;
      height: 100%;
      position: absolute;
      background-position: center;
      background-size: 100% 100%;
      background-repeat: no-repeat;
      background-image: url(${CircleImage});
      pointer-events: none;
    }
  `,
  divider: css`
    display: flex;
    align-items: center;
    text-align: center;
    &::before,
    &::after {
      content: '';
      flex: 1;
      border-bottom: 1px solid ${theme.colors.border.default};
    }
    &:not(:empty)::before {
      margin-right: ${theme.spacing[300]};
    }

    &:not(:empty)::after {
      margin-left: ${theme.spacing[300]};
    }
  `,
};

const create = (style: RuleSet<object>) => {
  const Component = styled.Text<StyledProps>`
    ${style}
    color: ${({ $color }) => $color ?? theme.colors.text.default};
    ${({ $italic }) =>
      $italic &&
      css`
        font-style: italic;
      `};
    ${({ $weight }) =>
      $weight &&
      css`
        font-weight: ${$weight};
      `};
    ${({ $center }) =>
      $center &&
      css`
        text-align: center;
      `};
    ${({ $em }) => $em && emStyles[$em]}
  `;

  const ForwardedTextComponent = forwardRef<NativeText, TextProps>((props, ref) => {
    const { color, italic, weight, center, em, ...rest } = props;

    return (
      <Component
        ref={ref}
        $color={color}
        $italic={italic}
        $weight={weight}
        $center={center}
        $em={em}
        {...rest}
      />
    );
  });

  ForwardedTextComponent.displayName = 'Text';
  return ForwardedTextComponent;
};

export const Text = Object.assign(create(theme.text.M), {
  DisplayXL: create(theme.text.displayXL),
  DisplayL: create(theme.text.displayL),
  H1: create(theme.text.H1),
  H2: create(theme.text.H2),
  H3: create(theme.text.H3),
  L: create(theme.text.L),
  M: create(theme.text.M),
  S: create(theme.text.S),
  Button: create(theme.text.button),
  Label: create(theme.text.label),
  Caption: create(theme.text.caption),
  FormLabel: create(theme.text.formLabel),
  FormPlaceholder: create(theme.text.formPlaceholder),
  FormMessage: create(theme.text.formMessage),
  Em: create(theme.text.displayL),
});
