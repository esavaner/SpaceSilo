import base from '@repo/shared/eslint';
import globals from 'globals';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  ...base({ cwd: import.meta.dirname }),
  {
    files: ['**/*.ts'],
    ignores: ['dist/**'],
    languageOptions: {
      globals: { ...globals.node, ...globals.jest },
      parserOptions: {
        // Ensure TypeScript-ESLint resolves this app’s tsconfig
        tsconfigRootDir: import.meta.dirname,
        // If you later enable type-aware rules, also set:
        project: ['./tsconfig.json'],
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
]);
