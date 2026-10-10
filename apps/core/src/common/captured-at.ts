import type { Prisma } from '@repo/shared';
import exifr from 'exifr';

type StoredMetadata = Prisma.InputJsonObject & { capturedAt?: string | null };
type Photo = { createdAt: Date; capturedAt?: Date | null; metadata?: unknown };

const asStoredMetadata = (metadata: unknown): StoredMetadata | null =>
  metadata && typeof metadata === 'object' && !Array.isArray(metadata) ? { ...(metadata as StoredMetadata) } : null;

const toDate = (value: unknown): Date | null => {
  if (!(value instanceof Date) && typeof value !== 'string' && typeof value !== 'number') {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const metadataCapturedAt = (metadata: unknown) => toDate(asStoredMetadata(metadata)?.capturedAt);

export const withCapturedAt = (metadata: unknown, capturedAt: Date | null): StoredMetadata | undefined => {
  const stored = asStoredMetadata(metadata) ?? {};
  if (capturedAt) {
    return { ...stored, capturedAt: capturedAt.toISOString() };
  }

  return Object.keys(stored).length > 0 ? stored : undefined;
};

export const resolveCapturedAt = (photo: Photo) =>
  metadataCapturedAt(photo.metadata) ?? photo.capturedAt ?? photo.createdAt;

export async function extractCapturedAt(fileBuffer: Buffer): Promise<Date | null> {
  try {
    const exif = await exifr.parse(fileBuffer, ['DateTimeOriginal', 'CreateDate', 'ModifyDate']);
    return toDate(exif?.DateTimeOriginal ?? exif?.CreateDate ?? exif?.ModifyDate);
  } catch {
    return null;
  }
}
