import js from '@eslint/js';
import globals from 'globals';
import pluginReact from 'eslint-plugin-react';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

// apps/docs is parked until the base project is finished.
const projects = ['core', 'native', 'shared'].join(',');

export default defineConfig([
  {
    ignores: [
      '**/node_modules/**',
      '**/build/**',
      '**/dist/**',
      '**/out/**',
      '**/web-build/**',
      '**/android/**',
      '**/ios/**',
      '**/.expo/**',
      '**/.next/**',
      '**/next-env.d.ts',
      'apps/docs/**',
    ],
  },
  {
    files: [`apps/{${projects}}/src/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}`],
    plugins: { js },
    extends: ['js/recommended'],
  },
  {
    files: [`apps/{${projects}}/src/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}`],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  {
    files: [`apps/{${projects}}/src/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}`],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
    },
  },
]);
