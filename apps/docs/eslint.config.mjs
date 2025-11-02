import base from '@repo/shared/eslint';
import { defineConfig } from 'eslint/config';
import nextPlugin from '@next/eslint-plugin-next';

export default defineConfig([
  ...base({ cwd: import.meta.dirname }),
  nextPlugin.configs['core-web-vitals'],
  {
    ignores: ['.next/**', 'out/**', 'build/**', 'next-env.d.ts'],
  },
]);
