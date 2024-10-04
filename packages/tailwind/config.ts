import type { Config } from 'tailwindcss';

export default {
  content: ['src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#4f46e5',
          DEFAULT: '#3b82f6',
          dark: '#1e3a8a',
        },
        secondary: {
          light: '#ec4899',
          DEFAULT: '#db2777',
          dark: '#9d174d',
        },
        accent: {
          light: '#fbbf24',
          DEFAULT: '#f59e0b',
          dark: '#b45309',
        },
        neutral: {
          light: '#f3f4f6',
          DEFAULT: '#e5e7eb',
          dark: '#374151',
        },
        success: {
          light: '#34d399',
          DEFAULT: '#10b981',
          dark: '#065f46',
        },
        warning: {
          light: '#fbbf24',
          DEFAULT: '#f59e0b',
          dark: '#b45309',
        },
        error: {
          light: '#f87171',
          DEFAULT: '#ef4444',
          dark: '#991b1b',
        },
      },
    },
  },
} satisfies Config;
