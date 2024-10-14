import { filesRouter } from './router/files';
import { createTRPCRouter } from './trpc';

export const appRouter = createTRPCRouter({
  files: filesRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
