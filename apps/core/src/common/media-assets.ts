import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import { environment } from '@/common/env.validation';

const THUMBNAIL_HEIGHT = 300;
const THUMBNAIL_JPEG_QUALITY = 82;
const PREVIEW_MAX_WIDTH = 1920;
const PREVIEW_MAX_HEIGHT = 1080;
const PREVIEW_JPEG_QUALITY = 90;
const SUPPORTED_IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tif', '.tiff', '.avif']);
// Extensions that may appear before a sidecar extension, as in IMG_1.jpg.xmp.
const KNOWN_MEDIA_EXTENSIONS = new Set([
  ...SUPPORTED_IMAGE_EXTENSIONS,
  '.heic',
  '.heif',
  '.cr2',
  '.cr3',
  '.nef',
  '.arw',
  '.dng',
  '.raf',
  '.orf',
  '.rw2',
  '.mov',
  '.mp4',
]);
const IGNORED_FILE_NAMES = new Set(['thumbs.db', 'desktop.ini']);

export const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.bmp': 'image/bmp',
  '.tif': 'image/tiff',
  '.tiff': 'image/tiff',
  '.avif': 'image/avif',
};

export const getMimeType = (filePath: string) =>
  MIME_TYPES[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream';

export const getStoragePaths = () => ({
  storagePath: environment.storagePath,
  thumbnailsPath: path.join(environment.appDataPath, 'thumbnails'),
  previewsPath: path.join(environment.appDataPath, 'previews'),
});

export function listFilesRecursive(dirPath: string): string[] {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  return fs.readdirSync(dirPath, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(dirPath, entry.name);
    return entry.isDirectory() ? listFilesRecursive(entryPath) : [entryPath];
  });
}

export const isSupportedImage = (filePath: string) =>
  SUPPORTED_IMAGE_EXTENSIONS.has(path.extname(filePath).toLowerCase());

export const isIgnoredFile = (filePath: string) => {
  const name = path.basename(filePath).toLowerCase();
  return name.startsWith('.') || IGNORED_FILE_NAMES.has(name);
};

// Files in the same directory with the same stem (any extension) belong to one media item.
export function getStemKey(relativeDir: string, fileName: string) {
  let stem = path.parse(fileName).name;
  const innerExtension = path.extname(stem).toLowerCase();

  if (KNOWN_MEDIA_EXTENSIONS.has(innerExtension)) {
    stem = stem.slice(0, -innerExtension.length);
  }

  return path.posix.join(relativeDir.split(path.sep).join('/'), stem).toLowerCase();
}

export function getStemKeyForStoredFile(filePath: string) {
  const relativePath = path.relative(getStoragePaths().storagePath, filePath);
  const dir = path.dirname(relativePath);
  return getStemKey(dir === '.' ? '' : dir, path.basename(filePath));
}

// Keep the source extension so IMG_1.jpg and IMG_1.png don't share one derived file.
const derivedPath = (rootPath: string, imagePath: string) => {
  const { dir, base } = path.parse(path.relative(getStoragePaths().storagePath, imagePath));
  return path.join(rootPath, dir, `${base}.jpg`);
};

export const getThumbnailOutputPath = (imagePath: string) => derivedPath(getStoragePaths().thumbnailsPath, imagePath);

const getPreviewOutputPath = (imagePath: string) => derivedPath(getStoragePaths().previewsPath, imagePath);

export function getNormalizedDimensions(metadata: sharp.Metadata) {
  const isRotated = metadata.orientation !== undefined && [5, 6, 7, 8].includes(metadata.orientation);
  const width = isRotated ? metadata.height : metadata.width;
  const height = isRotated ? metadata.width : metadata.height;

  return { width: width ?? 0, height: height ?? 0 };
}

export async function createThumbnail(fileBuffer: Buffer, targetPath: string) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });

  await sharp(fileBuffer)
    .rotate()
    .resize({ height: THUMBNAIL_HEIGHT })
    .jpeg({ quality: THUMBNAIL_JPEG_QUALITY })
    .toFile(targetPath);
}

// Small images need no preview; returns false and removes any stale one.
async function createPreview(fileBuffer: Buffer, targetPath: string) {
  const image = sharp(fileBuffer).rotate();
  const { width, height } = getNormalizedDimensions(await image.metadata());

  if (width && height && width <= PREVIEW_MAX_WIDTH && height <= PREVIEW_MAX_HEIGHT) {
    fs.rmSync(targetPath, { force: true });
    return false;
  }

  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  await image
    .resize({ width: PREVIEW_MAX_WIDTH, height: PREVIEW_MAX_HEIGHT, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: PREVIEW_JPEG_QUALITY, progressive: true })
    .toFile(targetPath);

  return true;
}

export async function ensurePreviewAsset(imagePath: string, fileBuffer?: Buffer) {
  const previewPath = getPreviewOutputPath(imagePath);
  if (fs.existsSync(previewPath)) {
    return previewPath;
  }

  const source = fileBuffer ?? (fs.existsSync(imagePath) ? fs.readFileSync(imagePath) : null);
  return source && (await createPreview(source, previewPath)) ? previewPath : null;
}
