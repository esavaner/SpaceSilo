FROM node:24-bookworm-slim

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable

WORKDIR /app

COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @repo/shared build

EXPOSE 3100

CMD ["pnpm", "--filter", "@repo/core", "exec", "node", "--loader", "@swc-node/register/esm", "--experimental-specifier-resolution=node", "src/main.ts"]