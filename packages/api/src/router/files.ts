import { z } from 'zod';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '../trpc';
import * as fs from 'fs';
import * as path from 'path';
import { TRPCError } from '@trpc/server';

const filesPath = process.env.FILES_PATH || '';

export const filesRouter = createTRPCRouter({
  hello: publicProcedure.query(() => {
    return { message: 'Hello from filesRouter' };
  }),
  create: protectedProcedure.input(z.object({ path: z.string().min(1) })).mutation(async ({ ctx, input }) => {
    const filePath = path.join(filesPath, input.path);
    // fs.writeFileSync(filePath, file.buffer);
    return { message: 'File created successfully' };
  }),
  stream: protectedProcedure.input(z.object({ path: z.string().min(1) })).query(async ({ ctx, input }) => {
    const filePath = path.join(filesPath, input.path);

    if (!fs.existsSync(filePath)) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'File not found',
      });
    }

    const stream = fs.createReadStream(filePath);
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', (err) => reject(err));
    });
  }),
});
