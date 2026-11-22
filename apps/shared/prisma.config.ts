import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'src/prisma/schema.prisma',
  migrations: {
    path: 'src/prisma/migrations',
  },
  datasource: {
    // Optional so `prisma generate` (e.g. Docker builds) works without a database; migrate/db commands still need it.
    url: process.env.DATABASE_URL,
  },
});
