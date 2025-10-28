import base from '@repo/shared/eslint';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  ...base({ cwd: import.meta.dirname }),
  {
    ignores: ['android/**', 'ios/**', '.expo/**', 'web-build/**'],
  },
]);
