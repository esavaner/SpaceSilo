import type { Config } from 'tailwindcss';

import baseConfig from '@repo/shared/tailwind';

export default {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [baseConfig],
  darkMode: 'class',
} satisfies Config;
