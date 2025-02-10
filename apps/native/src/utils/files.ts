export type FileType = 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | 'OTHER';

export const FileType: Record<FileType, FileType> = {
  IMAGE: 'IMAGE',
  VIDEO: 'VIDEO',
  AUDIO: 'AUDIO',
  DOCUMENT: 'DOCUMENT',
  OTHER: 'OTHER',
} as const;

export const FileTypes: Record<FileType, string[]> = {
  IMAGE: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'],
  VIDEO: ['mp4', 'avi', 'mkv', 'webm', 'mov', 'flv'],
  AUDIO: ['mp3', 'wav', 'flac', 'ogg', 'm4a'],
  DOCUMENT: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'md', 'csv'],
  OTHER: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'iso', 'apk', 'exe'],
};

export const getFileType = (ext?: string): FileType => {
  if (!ext) return FileType.OTHER;
  for (const [key, value] of Object.entries(FileTypes)) {
    if (value.includes(ext)) {
      return key as FileType;
    }
  }
  return FileType.OTHER;
};
