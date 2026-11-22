FROM node:26-bookworm-slim

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists
RUN npm install --global pnpm@10.28.1

WORKDIR /app

COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm build:core

EXPOSE 3100

CMD ["sh", "-c", "pnpm --filter @repo/shared exec prisma migrate deploy && exec node apps/core/build/main.js"]