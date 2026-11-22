# SpaceSilo

[![CI](https://github.com/esavaner/SpaceSilo/actions/workflows/ci.yml/badge.svg)](https://github.com/esavaner/SpaceSilo/actions/workflows/ci.yml)

SpaceSilo is a self-hosted storage system with:

- `apps/core`: NestJS backend API
- `apps/native`: Expo app used for web, mobile, and TV clients
- `apps/shared`: shared Prisma client, DTOs, and cross-app constants
- `apps/docs`: future public documentation site (parked, not part of the workspace yet)

The production shape is:

- one public web container serving the exported native web app
- one internal backend container exposed to the web container through `/api`
- an external PostgreSQL database supplied by the user through `DATABASE_URL`

## Prerequisites

- Node.js 26
- pnpm 10.28.1 (`npm install --global pnpm@10.28.1`; Node.js 26 does not bundle Corepack)
- Docker and Docker Compose for the provided dev/prod container flows
- PostgreSQL for production

On Windows PowerShell in this repo, prefer `pnpm.cmd` over `pnpm`.

## Install Dependencies

Run from the repository root:

```powershell
pnpm.cmd install
```

## Development

Development uses the local Docker database from [compose.dev.yml](compose.dev.yml) and runs the apps directly from source.

### 1. Start the development database

```powershell
docker compose -f compose.dev.yml up -d
```

This starts:

- PostgreSQL on `localhost:5432`
- Adminer on `http://localhost:8080`

### 2. Set development environment variables

In PowerShell:

```powershell
$env:DATABASE_URL='postgresql://postgres:pass123@localhost:5432/db?schema=public'
$env:FILES_PATH='C:\path\to\spacesilo\files'
$env:STORAGE_PATH='C:\path\to\spacesilo\storage'
$env:APPDATA_PATH='C:\path\to\spacesilo\appdata'
$env:JWT_SECRET='local-dev-jwt-secret-change-me-32-chars-min'
$env:CORS_ORIGINS='http://localhost:8081'
```

These paths are used by the backend for uploaded files, derived storage, previews, and thumbnails. `JWT_SECRET` signs access/refresh tokens and must be at least 32 characters.

### 3. Initialize the database

```powershell
pnpm.cmd reset
```

That resets Prisma from the initial migration, rebuilds `@repo/shared`, and seeds the default development user.

### 4. Start the backend

```powershell
pnpm.cmd --filter @repo/core dev
```

The backend listens on `http://localhost:3100` and the API is available under `http://localhost:3100/api`.

### 5. Start the native app in web mode

In a second terminal:

```powershell
pnpm.cmd --filter @repo/native dev
```

Expo Web usually serves on `http://localhost:8081`.

When connecting the app to a server, you can now enter either:

- `http://192.168.1.100`
- `192.168.1.100`

Bare hosts are normalized to `http://...` automatically before validation and storage.

### 6. Stop the development database

```powershell
docker compose -f compose.dev.yml down
```

## Production

Production uses [compose.yml](compose.yml), which starts:

- `core`: the NestJS backend container
- `web`: a Caddy container serving the exported native web build and reverse-proxying `/api/*` to `core`

Production does not start PostgreSQL for you. You must provide a working `DATABASE_URL` to an external or separately managed PostgreSQL instance.

### 1. Create a production env file

Create `.env` in the repo root based on [.env.example](.env.example):

```env
DATABASE_URL=postgresql://postgres:pass123@db.example.com:5432/spacesilo?schema=public
FILES_PATH=/absolute/path/to/files
STORAGE_PATH=/absolute/path/to/storage
APPDATA_PATH=/absolute/path/to/appdata
JWT_SECRET=<random string, at least 32 characters>
WEB_PORT=80
```

`DATABASE_URL`, `FILES_PATH`, `STORAGE_PATH`, `APPDATA_PATH`, and `JWT_SECRET` are required. Generate `JWT_SECRET` with something like `openssl rand -base64 48`; the backend refuses to start if it is missing or shorter than 32 characters. Changing it invalidates all existing sessions.

### 2. Prepare persistent data folders

The production compose file uses the three path variables from `.env` as host bind-mount sources.

- `FILES_PATH`: host folder mounted into the container at `/data/files`
- `STORAGE_PATH`: host folder mounted into the container at `/data/storage`
- `APPDATA_PATH`: host folder mounted into the container at `/data/appdata`

The backend reads the in-container `/data/...` paths, not the original host path strings directly. On Windows, set these to absolute Windows paths like `C:\data\spacesilo\files`; on Linux, use absolute POSIX paths like `/srv/spacesilo/files`.

### 3. Build and start the production stack

```powershell
docker compose up --build -d
```

The stack will:

- build the backend image from [apps/core/Dockerfile](apps/core/Dockerfile)
- build the web/proxy image from [apps/native/Dockerfile](apps/native/Dockerfile)
- expose the web UI on `http://<server-ip>:<WEB_PORT>`
- proxy API requests from `http://<server-ip>:<WEB_PORT>/api` to the backend container

The backend applies Prisma migrations before starting the compiled API. If migrations fail, the API does not start. The production image never runs the development seed. Existing installations must have compatible migration history. The session migration is additive so existing data is preserved; connections created before session tracking must sign in again.

Env files are excluded from Docker build contexts. Supply runtime secrets through the compose environment, not the image. Image builds need no `DATABASE_URL`: Prisma client generation does not connect to a database, and the backend container reads `DATABASE_URL` from the compose environment at startup.

### 4. Connect clients

- Browser users open `http://<server-ip>` or `http://<server-ip>:<WEB_PORT>`
- Mobile users enter that same base URL in the app

The native client stores the server root and automatically sends API requests to `/api`.

### 5. Stop the production stack

```powershell
docker compose down
```

## Compose Files

- [compose.dev.yml](compose.dev.yml): local development PostgreSQL + Adminer only
- [compose.yml](compose.yml): production-style web + backend stack with external PostgreSQL via `DATABASE_URL`

## Validation Commands

CI runs only on pushes to `master`, PR creation, and new commits pushed to an existing PR (`opened` / `synchronize`).

Useful checks from the repo root:

```powershell
pnpm.cmd lint
pnpm.cmd build
pnpm.cmd --filter @repo/core typecheck
pnpm.cmd --filter @repo/native exec eslint src/api/_client.ts src/api/core.client.ts src/hooks/useValidators.ts
```

## Notes

- `pnpm.cmd start:core` is not the preferred way to run the backend locally.
- The backend requires `DATABASE_URL`, `FILES_PATH`, `STORAGE_PATH`, `APPDATA_PATH`, and `JWT_SECRET` (min 32 chars) at runtime.
- The public API prefix is `/api` and is shared across backend and client code.
