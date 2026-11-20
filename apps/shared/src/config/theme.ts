import { createContext, useContext } from 'react';
import { createTheme, css } from 'styled-components/native';
import { baseColors, lightColors, type ThemeColors } from './colors';

// Leaves are placeholders resolved against the nearest ThemeProvider at render time, so styles follow live theme changes.
export const themeTokens = createTheme({ colors: lightColors });

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
  title: 'Lora, serif',
  body: 'Lato, sans-serif',
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

// Resolve against the font-size token; native percentages use the inherited font size.
const lineHeight = (size: (typeof fontSize)[keyof typeof fontSize], ratio: number) => `${parseFloat(size) * ratio}rem`;

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
      line-height: ${lineHeight(fontSize['4xl'], 1.15)};
    `,
    displayL: css`
      font-family: ${family.title};
      font-size: ${fontSize['3xl']};
      font-weight: 600;
      line-height: ${lineHeight(fontSize['3xl'], 1.15)};
    `,
    H1: css`
      font-family: ${family.title};
      font-size: ${fontSize['2xl']};
      font-weight: 600;
      line-height: ${lineHeight(fontSize['2xl'], 1.2)};
    `,
    H2: css`
      font-family: ${family.title};
      font-size: ${fontSize.xl};
      font-weight: 600;
      line-height: ${lineHeight(fontSize.xl, 1.25)};
    `,
    H3: css`
      font-family: ${family.title};
      font-size: ${fontSize.lg};
      font-weight: 600;
      line-height: ${lineHeight(fontSize.lg, 1.35)};
    `,
    L: css`
      font-family: ${family.body};
      font-size: ${fontSize.md};
      line-height: ${lineHeight(fontSize.md, 1.6)};
    `,
    M: css`
      font-family: ${family.body};
      font-size: ${fontSize.base};
      line-height: ${lineHeight(fontSize.base, 1.6)};
    `,
    S: css`
      font-family: ${family.body};
      font-size: ${fontSize.sm};
      line-height: ${lineHeight(fontSize.sm, 1.45)};
    `,

    // expanded font sizes
    button: css`
      font-family: ${family.body};
      font-size: ${fontSize.base};
      font-weight: 700;
      line-height: ${lineHeight(fontSize.base, 1.5)};
      letter-spacing: 0.3px;
    `,
    label: css`
      font-family: ${family.body};
      font-size: ${fontSize.sm};
      font-weight: 700;
      line-height: ${lineHeight(fontSize.sm, 1.2)};
      letter-spacing: 0.3px;
    `,
    caption: css`
      font-family: ${family.body};
      font-size: ${fontSize.xs};
      line-height: ${lineHeight(fontSize.xs, 1.4)};
      letter-spacing: 0.25px;
    `,
    formLabel: css`
      font-family: ${family.body};
      font-size: ${fontSize.xs};
      font-weight: 700;
      line-height: ${lineHeight(fontSize.xs, 1.4)};
      letter-spacing: 0.25px;
    `,
    formPlaceholder: css`
      font-family: ${family.body};
      font-size: ${fontSize.base};
      line-height: ${lineHeight(fontSize.base, 1.5)};
      letter-spacing: 0.3px;
    `,
    formMessage: css`
      font-family: ${family.body};
      font-size: ${fontSize.sm};
      line-height: ${lineHeight(fontSize.sm, 1.4)};
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
  colors: themeTokens.colors,
  baseColors,
  breakpointNumbers,
  breakpoints,
} as const;

export type ThemeMode = 'light' | 'dark' | 'system';

type ThemeModeContextType = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  scheme: 'light' | 'dark';
  colors: ThemeColors;
};

export const ThemeModeContext = createContext<ThemeModeContextType>({
  mode: 'system',
  setMode: () => {},
  scheme: 'light',
  colors: lightColors,
});

export const useThemeMode = () => useContext(ThemeModeContext);

// Real color values for props that bypass styled templates (icon colors, placeholderTextColor, inline styles).
export const useThemeColors = () => useContext(ThemeModeContext).colors;
