import { css } from 'styled-components';
import { colors } from './colors';

const LANDSCAPE_BREAKPOINT = 450;

const breakpointNumbers = {
  sm: 768,
  md: 1024,
  lg: 1440,
};

const breakpoints = {
  sm: `@media (min-width: ${breakpointNumbers.sm}px) and (min-height: ${LANDSCAPE_BREAKPOINT}px)`,
  md: `@media (min-width: ${breakpointNumbers.md}px)`,
  lg: `@media (min-width: ${breakpointNumbers.lg}px)`,
} as const;

const family = {
  title: 'Lora',
  body: 'Lato',
} as const;

const fontSize = {
  xs: '0.75rem',
  sm: '0.875rem',
  base: '1rem',
  md: '1rem',
  lg: '1.25rem',
  xl: '1.5rem',
  '2xl': '2rem',
  '3xl': '2.25rem',
  '4xl': '2.625rem',
} as const;

export const theme = {
  family,
  fontSize,
  spacing: {
    50: '2px',
    100: '4px',
    150: '6px',
    200: '8px',
    300: '12px',
    400: '16px',
    600: '24px',
    800: '32px',
    1000: '40px',
    1200: '48px',
  },
  radius: {
    100: '4px',
    150: '6px',
    200: '8px',
    300: '12px',
    400: '16px',
    600: '24px',
    800: '32px',
    1000: '40px',
    full: '999px',
  },
  borderWeight: {
    25: '1px',
    50: '2px',
    100: '4px',
  },
  text: {
    // base font sizes
    displayXL: css`
      font-family: ${family.title};
      font-size: ${fontSize['4xl']};
      font-weight: 600;
      line-height: 115%;
    `,
    displayL: css`
      font-family: ${family.title};
      font-size: ${fontSize['3xl']};
      font-weight: 600;
      line-height: 115%;
    `,
    H1: css`
      font-family: ${family.title};
      font-size: ${fontSize['2xl']};
      font-weight: 600;
      line-height: 120%;
    `,
    H2: css`
      font-family: ${family.title};
      font-size: ${fontSize.xl};
      font-weight: 600;
      line-height: 125%;
    `,
    H3: css`
      font-family: ${family.title};
      font-size: ${fontSize.lg};
      font-weight: 600;
      line-height: 135%;
    `,
    L: css`
      font-family: ${family.body};
      font-size: ${fontSize.md};
      line-height: 160%;
    `,
    M: css`
      font-family: ${family.body};
      font-size: ${fontSize.base};
      line-height: 160%;
    `,
    S: css`
      font-family: ${family.body};
      font-size: ${fontSize.sm};
      line-height: 145%;
    `,

    // expanded font sizes
    button: css`
      font-family: ${family.body};
      font-size: ${fontSize.base};
      font-weight: 700;
      line-height: 150%;
      letter-spacing: 0.3px;
    `,
    label: css`
      font-family: ${family.body};
      font-size: ${fontSize.sm};
      font-weight: 700;
      line-height: 120%;
      letter-spacing: 0.3px;
    `,
    caption: css`
      font-family: ${family.body};
      font-size: ${fontSize.xs};
      line-height: 140%;
      letter-spacing: 0.25px;
    `,
    formLabel: css`
      font-family: ${family.body};
      font-size: ${fontSize.xs};
      font-weight: 700;
      line-height: 140%;
      letter-spacing: 0.25px;
    `,
    formPlaceholder: css`
      font-family: ${family.body};
      font-size: ${fontSize.base};
      line-height: 150%;
      letter-spacing: 0.3px;
    `,
    formMessage: css`
      font-family: ${family.body};
      font-size: ${fontSize.sm};
      line-height: 140%;
      letter-spacing: 0.25px;
    `,
  },
  zIndex: {
    fullPageLoader: 10000,
    toast: 1500,
    dropdown: 1100,
    modal: 1000,
    banner: 100,
    raised: 10,
    base: 0,
    below: -10,
    bg: -1000,
  },
  colors,
  breakpointNumbers,
  breakpoints,
} as const;
