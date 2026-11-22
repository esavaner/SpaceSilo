# SpaceSilo agent guide

This is the main guide for AI agents (Copilot, Claude, Codex, and others) and for people working in this repo. Trust this file first. Only search the repo when the task touches an area not covered here or when these instructions are clearly stale. If you find something stale, fix it here.

## Where context lives

| What                                                              | Where                                                                                                                               | When to read                                   |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| Product vision, architecture, glossary, cross-cutting rules       | Linear document **"SpaceSilo — Product Overview"** (team Space silo)                                                                | Once per session, before you plan feature work |
| How work is tracked (hierarchy, labels, statuses, issue template) | [docs/agents/linear-workflow.md](docs/agents/linear-workflow.md) (a mirror of the Linear doc "Agent Guide — How we work in Linear") | Before you create or update Linear issues      |
| Feature spec (an epic)                                            | The description of the Linear **project**                                                                                           | Before you work on any issue in that project   |
| Story spec                                                        | The Linear **issue** (`SPA-<n>`)                                                                                                    | Always, for the task at hand                   |
| Repo commands, layout, conventions                                | This file                                                                                                                           | Always                                         |
| Shared UI component rules                                         | [docs/agents/shared-components.md](docs/agents/shared-components.md)                                                                | Before you touch `apps/shared/src/components`  |
| Running and deploying                                             | [README.md](README.md)                                                                                                              | When you need setup or production details      |
| Reusable agent skills                                             | `.agents/skills/*`                                                                                                                  | When a skill matches the task                  |

Rules of precedence: the user's explicit instruction comes first, then the Linear issue, then the project spec, then this file. When code and spec disagree, the code is the truth for **done** behavior. Flag the mismatch in the issue instead of silently "fixing" it.

## Working from a Linear issue (summary)

1. Read the issue, its parent project, and the issues it's blocked by before assessing complexity or choosing a delegate. Base delegation on the actual scope, not the short request or issue ID. Move the issue to **In Progress**.
2. Work on the issue's branch name (`spa-<n>-<slug>`, shown in Linear) when the user wants a branch. Mention `SPA-<n>` in commits and PRs.
3. Implement it full stack in this order: `apps/shared` (DTOs/schema) → `apps/core` → `apps/native`. Keep every user-facing string localized.
4. Validate with the commands below. Tick the acceptance criteria checkboxes in the issue description.
5. Comment on the issue with a short summary: what changed, anything left out, and what the user should check manually. Move it to **In Review**. The user moves it to **Done**.
6. If you discover new work, create a new Backlog issue in the right project (use the template in `docs/agents/linear-workflow.md`) instead of expanding scope.

## Repository Summary

SpaceSilo is a pnpm monorepo for a personal or shared media storage product. It contains:

- `apps/core`: NestJS 12 backend API on Node.js
- `apps/shared`: shared DTOs, Prisma schema/client, and the shared UI component library (styled-components 7 prerelease, native first, web via react-native-web)
- `apps/docs`: Next.js 16 app, planned as the public project documentation site for future users. **Parked until the base project is finished**: it's excluded from the pnpm workspace (`!apps/docs` in `pnpm-workspace.yaml`), the root `tsconfig.json` references, and ESLint, so install, lint, typecheck, and build all skip it. Don't edit or validate it unless the user asks. To re-enable it, revert those three exclusions and run `pnpm.cmd install`
- `apps/native`: Expo 57 / React Native Web client (Expo Router, styled-components, TypeScript 6)

Languages and tooling: TypeScript throughout, Prisma 7, PostgreSQL, SWC for backend and shared builds, ESLint 9 flat config, Prettier, React 19.

Observed locally on Windows: Node `v26.13.0`. The repo pins `pnpm@10.28.1` in the root `package.json`.

The root `README.md` is accurate (dev and production setup). The app READMEs (`apps/core`, `apps/native`) are still starter templates and aren't authoritative.

## Layout And Architecture

- Root files: `compose.yml` (production: `core` + `web`), `compose.dev.yml` (dev: Postgres + Adminer), `.env.example`, `package.json`, `pnpm-workspace.yaml`, `apps/`, `.vscode/`
- `apps/core/src/main.ts`: Nest bootstrap, global `HttpExceptionFilter`, validation pipe, CORS, API prefix from `@repo/shared/constants/api`, listens on port `3100`
- `apps/core/src/app.module.ts`: registers controllers/services and `ConfigModule` with `validateEnvironment`
- `apps/core/src/common/env.validation.ts`: backend requires `DATABASE_URL`, `FILES_PATH`, `STORAGE_PATH`, and `APPDATA_PATH`; optional `RSYNC_BIN`, `BACKUP_RSYNC_SSH_PORT`, `BACKUP_RSYNC_SSH_USER`
- `apps/core/src/controllers/*`, `services/*`, `guards/*`, `decorators/*`: API surface, business logic, auth/roles
- `apps/core/src/common/prisma.service.ts`: backend Prisma client wrapper using `@repo/shared`
- `apps/shared/src/index.tsx`: main shared exports (DTOs, Prisma, API constants, types); update this when adding DTOs or shared Prisma helpers
- `apps/shared` subpath exports: `@repo/shared/components` (UI barrel), `@repo/shared/style` (web-only `GlobalStyle`), `@repo/shared/constants/api`
- `docs/agents/shared-components.md`: rules and lessons learned for shared UI component work. Read it before you touch shared components
- `apps/shared/src/prisma/schema.prisma`: canonical data model (User, Group, GroupMember, Album, Media, MediaFile, Note, Backup)
- `apps/shared/src/prisma/seed.ts`: dev seed
- `apps/native/src/app/_layout.tsx`: Expo root layout; routes under `(tabs)`, `login`, and `view`
- `apps/native/src/api/*`: HTTP clients used by the mobile/web client
- `apps/native/src/providers/*` and `apps/native/src/hooks/*`: app state, server connections, and query logic

There is no `CONTRIBUTING.md`. GitHub Actions runs the backend integration tests; broader CI is tracked in Linear under Platform & DevEx.

## Validated Command Order

Run commands from the repo root. In Windows PowerShell, use `pnpm.cmd` instead of `pnpm` because the PowerShell shim can be blocked by execution policy. In other shells, plain `pnpm` should be fine.

1. Bootstrap
   - Run `pnpm.cmd install`
   - Postcondition: `apps/shared` automatically runs `prisma generate` via `postinstall`

2. Lint
   - Run `pnpm.cmd lint` (about 7s)
   - Current state: passes with existing warnings only (`any` and unused variables); don't treat warnings as blockers unless the user asks

3. Typecheck
   - Per package: `pnpm.cmd --filter <pkg> typecheck`. Prefer this and only check the packages you touched
   - Root `pnpm.cmd typecheck` builds `@repo/shared` first, then typechecks every package
   - `pnpm.cmd --filter <pkg> check` runs lint + typecheck for one package
   - Current state: `@repo/shared`, `@repo/native`, and `@repo/core` all pass. Don't add new errors

4. Build
   - `pnpm.cmd build` builds `@repo/shared` and `@repo/core` (docs is parked)
   - `pnpm.cmd build:core` builds only shared + core and passes
   - `@repo/native` has no build script; `pnpm.cmd --filter @repo/native export:web` exports the web build to `apps/native/dist`

5. Database
   - Start local Postgres + Adminer: `docker compose -f compose.dev.yml up -d` (Postgres on `localhost:5432`, Adminer on `localhost:8080`)
   - `DATABASE_URL=postgresql://postgres:pass123@localhost:5432/db?schema=public`
   - `.env` lives at the repo root (template: `.env.example`), but `dotenv/config` and Nest `ConfigModule` read `.env` from the package's working directory. When running with `--filter`, set the variables in the shell
   - Preferred early-dev reset: `pnpm.cmd reset` (runs `pnpm --filter @repo/shared reset`: Prisma migrate reset, rebuild shared, run seed). Seeded dev user: `t@t.com` / `123456`, personal group `testcom`
   - Schema sync without reset: `pnpm.cmd --filter @repo/shared db:push`
   - Stop with `docker compose -f compose.dev.yml down`

6. Run backend (see Token Budget)
   - Set `DATABASE_URL`, `FILES_PATH`, `STORAGE_PATH`, and `APPDATA_PATH` first, for example `$env:FILES_PATH='C:\path\to\files'`
   - Dev (SWC watch + node watch): `pnpm.cmd --filter @repo/core dev`
   - Production-like: `pnpm.cmd start:core` (builds shared + core, then runs `node build/main.js`)
   - The user often already has core running on port `3100`; an `EADDRINUSE` error means it is already up. Don't kill it
   - Backend tests: `pnpm.cmd --filter @repo/core test`. Docker must be running; tests build shared and core with SWC, start a disposable PostgreSQL container, apply migrations, and use temporary storage. They do not use the development database. Every new backend story must add tests. Tests for known security gaps are skipped until their fixes land; in PowerShell, use `$env:RUN_PENDING_SECURITY_TESTS='1'` before running the test command to see the expected failures, then `Remove-Item Env:RUN_PENDING_SECURITY_TESTS`.

7. Run frontends (only when the user asks; see Token Budget)
   - Native web: `pnpm.cmd --filter @repo/native dev` (`expo start --web`)

## Known Broken Or Misleading Scripts

- `pnpm.cmd clean` is not portable on Windows: it fails on `rm -rf node_modules`

## Change Guidance

- Backend API contract changes usually touch `apps/shared` first, then `apps/core`, then `apps/native`
- If you change shared exports, rebuild `@repo/shared` (`pnpm.cmd --filter @repo/shared build`) before validating consumers
- For backend-only changes, run `pnpm.cmd --filter @repo/core lint` and `pnpm.cmd build:core`. Compare typecheck errors with the known existing ones
- For shared component changes, follow `docs/agents/shared-components.md`
- For Prisma schema changes during early development, prefer folding them into `apps/shared/src/prisma/migrations/20260127001311_init` instead of adding new migrations unless the user explicitly wants migration history preserved
- For Prisma schema changes, run `pnpm.cmd reset` for a clean reset with seed data, or `pnpm.cmd --filter @repo/shared db:push` then rebuild shared for incremental sync

## Token Budget

Session analysis showed that browser testing and dev-server polling used about 25% of agent tokens, and full-file re-reads and repeated typechecks used most of the rest. The user does manual testing of the native and web apps.

- By default, don't start Expo/Next/web dev servers, open a browser, or run Playwright/screenshots. Instead, end with a short list of what the user should check manually.
- Exceptions: the user explicitly asks for it, or the bug is web-only. For a web-only bug, do one quick browser check (reuse an already-running server if there is one), then stop the server and don't keep polling or iterating in the browser.
- Don't run `expo export` just as a check. Run it only after changing dependencies, package exports, or Metro/Babel config.
- Run typecheck, lint, and prettier once after a batch of edits, not after each edit.
- Read a file once, then edit it. Use `view_range` and `grep` instead of re-reading whole files.
- Use `git --no-pager diff --stat` or diff specific files. Never diff `pnpm-lock.yaml`.

## Localization Guidance

- Treat every user-facing string as localizable. Do not add new hardcoded UI labels, button text, empty states, toasts, alerts, validation messages, or backend-exposed response messages directly in code.
- Add new native-app translation keys to `apps/native/src/i18n/locales/en.json`. Do English only, do not add other locales.
- When other locale files already cover the same feature area, keep the key structure aligned even if only the English text is added immediately.
- For simple count labels, prefer direct composition like `${count} ${t('files')}` over i18next `count`-option pluralization.
- Avoid introducing `t('some.key', { count })` for cases where the count is only leading or trailing display text. Keep the translated noun or suffix in JSON, but compose the visible count in code.
- Full translated sentences can still use named interpolation params when needed, but prefer non-`count` placeholder names like `photoCount`, `fileCount`, or `serverCount`.
- If a backend message needs to reach the frontend, send a stable message key plus params and let the frontend translate it.

Prefer these instructions over fresh exploration. Search only when the task needs code-level details that are not already mapped here.
