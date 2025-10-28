import { defineConfig } from 'eslint/config';
import base from './eslint.shared.mjs';

export default defineConfig([...base({ cwd: import.meta.dirname })]);
