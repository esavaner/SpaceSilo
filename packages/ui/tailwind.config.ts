import type { Config } from 'tailwindcss';

// @ts-expect-error - no types
import nativewind from 'nativewind/preset';

import baseConfig from '@repo/tailwind/config';

export default {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [baseConfig, nativewind],
  darkMode: 'class',
} satisfies Config;
