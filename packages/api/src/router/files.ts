import { z } from 'zod';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '../trpc';
import * as fs from 'fs';
import * as path from 'path';
import { TRPCError } from '@trpc/server';
import { zfd } from 'zod-form-data';
import { Readable } from 'node:stream';

const filesPath = process.env.FILES_PATH || '';

export const filesRouter = createTRPCRouter({
  hello: publicProcedure.query(() => {
    return { message: 'Hello from filesRouter' };
  }),
  upload: protectedProcedure
    .input(zfd.formData({ name: zfd.text(), file: zfd.file(), path: zfd.text() }))
    .mutation(async ({ ctx, input }) => {
      const fileDir = path.join(filesPath, input.path);
      const filePath = path.join(fileDir, input.file.name);
      if (!fs.existsSync(fileDir)) {
        fs.mkdirSync(fileDir, { recursive: true });
      }
      const fd = fs.createWriteStream(filePath);
      const fileStream = Readable.fromWeb(
        // @ts-expect-error - unsure why this is not working
        input.file.stream()
      );
      for await (const chunk of fileStream) {
        fd.write(chunk);
      }
      fd.end();
      return {
        url: filePath,
        name: input.file.name,
      };
    }),
  create: protectedProcedure.input(z.object({ path: z.string().min(1) })).mutation(async ({ ctx, input }) => {
    const filePath = path.join(filesPath, input.path);
    // fs.writeFileSync(filePath, file.buffer);
    return { message: 'File created successfully' };
  }),
  stream: protectedProcedure.input(z.object({ path: z.string().min(1) })).query(async ({ ctx, input }) => {
    const filePath = path.join(filesPath, input.path);

    console.log('stream', filePath);
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
  view: protectedProcedure.input(z.object({ path: z.string().min(1) })).query(async ({ ctx, input }) => {
    const filePath = path.join(filesPath, input.path);

    if (!fs.existsSync(filePath)) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'File not found',
      });
    }

    const fileBuffer = fs.readFileSync(filePath);
    return {
      contentType: 'image/jpg',
      file: fileBuffer,
    };
  }),
});
