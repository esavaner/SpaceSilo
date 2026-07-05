# SpaceSilo

SpaceSilo is a self-hosted storage system with:

- `apps/core`: NestJS backend API
- `apps/native`: Expo app used for web, mobile, and TV clients
- `apps/shared`: shared Prisma client, DTOs, and cross-app constants
- `apps/docs`: separate docs/site app

The production shape is:

- one public web container serving the exported native web app
- one internal backend container exposed to the web container through `/api`
- an external PostgreSQL database supplied by the user through `DATABASE_URL`

## Prerequisites

- Node.js 24
- `pnpm` via Corepack or a compatible local install
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
```

These paths are used by the backend for uploaded files, derived storage, previews, and thumbnails.

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
WEB_PORT=80
```

`DATABASE_URL`, `FILES_PATH`, `STORAGE_PATH`, and `APPDATA_PATH` are required.

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

Useful checks from the repo root:

```powershell
pnpm.cmd lint
pnpm.cmd build
pnpm.cmd --filter @repo/core typecheck
pnpm.cmd --filter @repo/native exec eslint src/api/_client.ts src/api/core.client.ts src/hooks/useValidators.ts
```

## Notes

- `pnpm.cmd start:core` is not the preferred way to run the backend locally.
- The backend requires `DATABASE_URL`, `FILES_PATH`, `STORAGE_PATH`, and `APPDATA_PATH` at runtime.
- The public API prefix is `/api` and is shared across backend and client code.
