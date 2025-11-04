import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        basedark: 'var(--color-dark)',
        baselight: 'var(--color-light)',
        content: {
          DEFAULT: 'var(--color-text)',
          secondary: 'var(--color-text-secondary)',
          tertiary: 'var(--color-text-tertiary)',
        },
        layer: {
          DEFAULT: 'var(--color-background)',
          secondary: 'var(--color-background-secondary)',
          tertiary: 'var(--color-background-tertiary)',
        },
        primary: {
          DEFAULT: 'var(--color-primary)',
          dark: 'var(--color-primary-dark)',
          light: 'var(--color-primary-light)',
        },
        secondary: {
          DEFAULT: 'var(--color-secondary)',
          dark: 'var(--color-secondary-dark)',
          light: 'var(--color-secondary-light)',
        },
        red: {
          DEFAULT: 'var(--color-red)',
          dark: 'var(--color-red-dark)',
          light: 'var(--color-red-light)',
        },
        yellow: {
          DEFAULT: 'var(--color-yellow)',
          dark: 'var(--color-yellow-dark)',
          light: 'var(--color-yellow-light)',
        },
        blue: {
          DEFAULT: 'var(--color-blue)',
          dark: 'var(--color-blue-dark)',
          light: 'var(--color-blue-light)',
        },
      },
    },
  },
};

export default config satisfies Config;
