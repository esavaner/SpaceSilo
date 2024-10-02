// @ts-expect-error - no types
import nativewind from 'nativewind/preset';

module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
  presets: [nativewind],
};
