import type { Config } from 'tailwindcss';

// @ts-expect-error - no types
import nativewind from 'nativewind/preset';

import baseConfig from '@repo/tailwind';

export default {
  content: ['./app/**/*.{js,jsx,ts,tsx}'],
  presets: [baseConfig, nativewind],
} satisfies Config;
