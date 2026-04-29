# SpaceSilo Copilot Instructions

Trust this file first. Only search the repo when the task touches an area not covered here or when these instructions are clearly stale.

## Repository Summary

SpaceSilo is a pnpm/Turborepo monorepo for a personal or shared media storage product. It contains:

- `apps/core`: NestJS 11 backend API on Node.js
- `apps/shared`: shared DTOs, Prisma schema/client, and shared exports consumed by other apps
- `apps/docs`: Next.js 16 app-router web app
- `apps/native`: Expo 54 / React Native Web client

Languages and tooling: TypeScript throughout, Prisma 7, PostgreSQL, Turbo 2, SWC for backend builds, ESLint 9 flat config, React 19, Next.js 16, Expo Router.

Observed locally on Windows: Node `v24.13.0`. The repo pins `pnpm@10.28.1` in the root `package.json`.

Important: the root README and app READMEs are still starter-template docs and are not authoritative for this repo.

## Layout And Architecture

- Root files: `compose.yml`, `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `README.md`, `apps/`, `.vscode/`
- `apps/core/src/main.ts`: Nest bootstrap, global validation pipe, CORS, listens on port `3100`
- `apps/core/src/app.module.ts`: registers controllers/services and `ConfigModule`
- `apps/core/src/common/env.validation.ts`: backend requires `FILES_PATH`, `STORAGE_PATH`, and `APPDATA_PATH`
- `apps/core/src/controllers/*` and `apps/core/src/services/*`: API surface and business logic
- `apps/core/src/common/prisma.service.ts`: backend Prisma client wrapper using `@repo/shared`
- `apps/shared/src/index.tsx`: all shared exports; update this when adding DTOs or shared Prisma helpers
- `apps/shared/src/prisma/schema.prisma`: canonical data model (User, Group, GroupMember, Album, Photo)
- `apps/docs/src/app/*`: Next.js app-router pages and layout
- `apps/native/src/app/_layout.tsx`: Expo root layout; tab routes live under `apps/native/src/app/(tabs)`
- `apps/native/src/api/*`: HTTP clients used by the mobile/web client
- `apps/native/src/providers/*` and `apps/native/src/hooks/*`: app state, server connections, and query logic

There is no `CONTRIBUTING.md` and no `.github/workflows` in this repo. The local commands below are the nearest equivalent to CI/check-in validation.

## Validated Command Order

Run commands from the repo root. In Windows PowerShell, use `pnpm.cmd` instead of `pnpm` because the PowerShell shim can be blocked by execution policy. In other shells, plain `pnpm` should be fine.

1. Bootstrap
   - Run `pnpm.cmd install`
   - Validated: succeeds in about 22s
   - Postcondition: `apps/shared` automatically runs `prisma generate` via `postinstall`
   - Expected warning: `apps/native/package.json` contains a local `pnpm.overrides` field, but pnpm only honors overrides from the workspace root

2. Lint
   - Run `pnpm.cmd lint`
   - Validated: succeeds in about 12s
   - Current state: existing warnings only, mostly unused variables and `any` usage in `apps/native` plus a few warnings in `apps/core`
   - Do not treat warning-free output as a prerequisite for merging unless the user asks you to clean them up

3. Build
   - Run `pnpm.cmd build`
   - Validated: succeeds in about 8s
   - What it actually builds: `@repo/shared`, `@repo/core`, and `@repo/docs`
   - `@repo/native` has no build script and is not part of the root build pipeline

4. Backend database setup
   - If you need a local database, run `docker compose up -d`
   - Validated: starts PostgreSQL on `localhost:5432` and Adminer on `localhost:8080`
   - Use `DATABASE_URL=postgresql://postgres:pass123@localhost:5432/postgres`
   - Run `pnpm.cmd --filter @repo/shared db:push`
   - Validated: succeeds and syncs the schema to the local database
   - Run `pnpm.cmd --filter @repo/shared db:generate`
   - Validated: succeeds without needing a database connection
   - After DB work, run `docker compose down`

5. Run docs app
   - Run `pnpm.cmd --filter @repo/docs dev`
   - Validated: starts Next.js on `http://localhost:4000` and was ready in about 5s

6. Run backend in development
   - Always set `FILES_PATH`, `STORAGE_PATH`, and `APPDATA_PATH` first
   - Example PowerShell sequence:
     - `$env:FILES_PATH='C:\path\to\files'`
     - `$env:STORAGE_PATH='C:\path\to\storage'`
     - `$env:APPDATA_PATH='C:\path\to\appdata'`
     - `pnpm.cmd --filter @repo/core dev`
   - Validated: this path stays up and serves requests; the watch/type-check process reported `Found 0 issues`

## Known Broken Or Misleading Scripts

- Do not rely on `pnpm.cmd start:core`
  - Validated failure: it builds successfully, then `node build/src/main.js` crashes with `ERR_MODULE_NOT_FOUND` for `build/src/app.module`
  - Practical workaround: use `pnpm.cmd --filter @repo/core dev` instead

- `pnpm.cmd clean` is not portable on Windows
  - Validated failure: Turbo reports no package `clean` tasks, then the script fails on `rm -rf node_modules`

- `pnpm.cmd --filter @repo/core test`
  - Validated failure: exits with `No tests found`

- `pnpm.cmd --filter @repo/core test:e2e`
  - Validated failure: references missing file `apps/core/test/jest-e2e.json`

- `pnpm.cmd --filter @repo/native api`
  - Treat as stale until proven otherwise
  - The script expects Swagger JSON at `http://localhost:3100/api/json`, but no Swagger bootstrap code exists in `apps/core/src/main.ts`

## Change Guidance

- Backend API contract changes usually touch `apps/shared` first, then `apps/core`, then `apps/native`
- If you change shared DTO exports, rebuild `@repo/shared` before validating consumers
- For backend-only changes, always run at least `pnpm.cmd lint`, `pnpm.cmd build`, and if runtime behavior changed, `pnpm.cmd --filter @repo/core dev` with the required env vars
- For docs-only changes, run `pnpm.cmd --filter @repo/docs build` and `pnpm.cmd --filter @repo/docs lint`
- For Prisma schema changes, run `docker compose up -d`, set `DATABASE_URL`, run `pnpm.cmd --filter @repo/shared db:push`, then rebuild shared

Prefer these instructions over fresh exploration. Search only when the task needs code-level details that are not already mapped here.
