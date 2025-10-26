import type { Config } from 'tailwindcss';

// @ts-expect-error - no types
import nativewind from 'nativewind/preset';

import baseConfig from '@repo/shared/tailwind';

export default {
  content: ['./src/**/*.{js,jsx,ts,tsx}', '../../packages/ui/src/**/*.{js,jsx,ts,tsx}'], // @TODO find a better way to include the ui package
  presets: [baseConfig, nativewind],
  darkMode: 'class',
} satisfies Config;
