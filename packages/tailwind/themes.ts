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
    '--color-base-50': '#f3f4f6',
    '--color-base-100': '#e5e7eb',
    '--color-base-200': '#d1d5db',
    '--color-base-300': '#b0b8c1',
    '--color-base-400': '#8b95a1',
    '--color-base-500': '#6b7280',
    '--color-base-600': '#4b5563',
    '--color-base-700': '#374151',
    '--color-base-800': '#1f2937',
    '--color-base-900': '#111827',
  }),
  dark: vars({
    ...base,
    '--color-base-50': '#111827',
    '--color-base-100': '#1f2937',
    '--color-base-200': '#374151',
    '--color-base-300': '#4b5563',
    '--color-base-400': '#6b7280',
    '--color-base-500': '#8b95a1',
    '--color-base-600': '#b0b8c1',
    '--color-base-700': '#d1d5db',
    '--color-base-800': '#e5e7eb',
    '--color-base-900': '#f3f4f6',
  }),
};
