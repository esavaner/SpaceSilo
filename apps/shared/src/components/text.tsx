import { forwardRef } from 'react';
import styled, { css, RuleSet } from 'styled-components';
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
type TextProps<E extends React.ElementType> = Omit<React.ComponentPropsWithoutRef<E>, 'as' | 'color'> &
  ComponentProps & {
    as?: E;
  };

type TextComponent<T extends React.ElementType> = <E extends React.ElementType = T>(
  props: TextProps<E> & { ref?: React.ComponentPropsWithRef<E>['ref'] }
) => React.ReactElement | null;

const emStyles: Record<EmVariant, RuleSet<object>> = {
  primary: css`
    color: var(--text-brand);
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
      border-bottom: 1px solid var(--border-neutral-default);
    }
    &:not(:empty)::before {
      margin-right: var(--spacing-300);
    }

    &:not(:empty)::after {
      margin-left: var(--spacing-300);
    }
  `,
};

const create = <T extends React.ElementType>(defaultAs: T, style: RuleSet<object>) => {
  const Component = styled.span<StyledProps>`
    ${style}
    color: ${({ $color }) => $color ?? 'var(--text-primary-default)'};
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

  const ForwardedTextComponent = forwardRef<HTMLElement, TextProps<T>>((props, ref) => {
    const { as, color, italic, weight, center, em, ...rest } = props as TextProps<T>;

    return (
      <Component
        ref={ref}
        as={as ?? defaultAs}
        $color={color}
        $italic={italic}
        $weight={weight}
        $center={center}
        $em={em}
        {...rest}
      />
    );
  });

  ForwardedTextComponent.displayName = typeof defaultAs === 'string' ? `Text(${defaultAs})` : 'Text';

  const TextComponent = ForwardedTextComponent as unknown as TextComponent<T>;

  return TextComponent;
};

export const Text = Object.assign(create('span', theme.text.M), {
  DisplayXL: create('h1', theme.text.displayXL),
  DisplayL: create('h1', theme.text.displayL),
  H1: create('h1', theme.text.H1),
  H2: create('h2', theme.text.H2),
  H3: create('h3', theme.text.H3),
  L: create('p', theme.text.L),
  M: create('p', theme.text.M),
  S: create('p', theme.text.S),
  Button: create('span', theme.text.button),
  Label: create('label', theme.text.label),
  Caption: create('span', theme.text.caption),
  FormLabel: create('label', theme.text.formLabel),
  FormPlaceholder: create('span', theme.text.formPlaceholder),
  FormMessage: create('span', theme.text.formMessage),
  Em: create('i', theme.text.displayL),
});
