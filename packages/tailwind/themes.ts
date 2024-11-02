import { vars } from 'nativewind';

const base = vars({
  '--color-primary': '#a73a51',
  '--color-primary-dark': '#7c3b4f',
  '--color-primary-light': '#d24c57',
  '--color-secondary': '#f28065',
  '--color-secondary-dark': '#ef7f67',
  '--color-secondary-light': '#f8b58a',
});

export const themes = {
  light: vars({
    ...base,
    '--color-text': '#0e0e0e',
    '--color-text-secondary': '#222222',
    '--color-text-tertiary': '#464646',
    '--color-background': '#fdfdfd',
    '--color-background-secondary': '#f7f7f7',
    '--color-background-tertiary': '#e5e5e5',
  }),
  dark: vars({
    ...base,
    '--color-text': '#fcfcfc',
    '--color-text-secondary': '#f7f7f7',
    '--color-text-tertiary': '#e5e5e5',
    '--color-background': '#1e1e1e',
    '--color-background-secondary': '#464646',
    '--color-background-tertiary': '#6d6d6d',
  }),
};
