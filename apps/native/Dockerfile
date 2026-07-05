FROM node:24-bookworm-slim AS builder

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable

WORKDIR /app

COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @repo/shared build
RUN pnpm --filter @repo/native export:web

FROM caddy:2.10-alpine

COPY apps/native/Caddyfile /etc/caddy/Caddyfile
COPY --from=builder /app/apps/native/dist /srv

EXPOSE 80